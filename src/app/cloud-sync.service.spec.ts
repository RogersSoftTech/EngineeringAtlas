import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { afterEach,beforeEach,describe,expect,it,vi } from 'vitest';
import { CloudApiService,CloudError } from './cloud-api.service';
import { CloudSyncService } from './cloud-sync.service';
import { CourseLibraryService } from './course-library.service';
import { ProgressService } from './progress.service';
import { AtlasState } from './models';
const empty=():AtlasState=>({version:1,mode:'learning',records:{},last:null});
describe('account-scoped Azure synchronization',()=>{
  let api:any;let courses:any;
  beforeEach(()=>{
    localStorage.clear();api={identity:signal(null),active:signal(false),connect:vi.fn(async()=>{const i={owner:'alice',displayName:'Alice',storage:'azure-blob'};api.identity.set(i);api.active.set(true);return i;}),progress:vi.fn().mockResolvedValue({state:empty(),etag:'v1'}),saveProgress:vi.fn().mockResolvedValue({etag:'v2'})};
    courses={activateCloudScope:vi.fn(),refreshImports:vi.fn(),syncPending:vi.fn(),legacyImports:vi.fn().mockResolvedValue([]),saveDocuments:vi.fn()};
    TestBed.configureTestingModule({providers:[{provide:CloudApiService,useValue:api},{provide:CourseLibraryService,useValue:courses}]});
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();});
  it('loads the signed-in account state without uploading legacy browser data automatically',async()=>{
    const p=TestBed.inject(ProgressService);p.update('t0m0',{notes:'Legacy'});const s=TestBed.inject(CloudSyncService);await s.start();expect(p.record('t0m0').notes).toBeUndefined();expect(s.legacyAvailable()).toBe(true);expect(api.saveProgress).not.toHaveBeenCalled();expect(p.legacyState()?.records['learning:t0m0'].notes).toBe('Legacy');
  });
  it('saves edits with the last known Azure version and retains an account-scoped device copy',async()=>{
    const s=TestBed.inject(CloudSyncService);await s.start();s.p.update('t0m0',{notes:'My cloud note'});await s.syncNow();expect(api.saveProgress).toHaveBeenCalledWith(expect.objectContaining({records:expect.objectContaining({'learning:t0m0':expect.objectContaining({notes:'My cloud note'})})}),'v1');expect(s.status()).toBe('Saved to Azure ✓');expect(localStorage.getItem('engineering-atlas-v1:alice')).toContain('My cloud note');
  });
  it('keeps offline edits queued instead of claiming they reached Azure',async()=>{
    const s=TestBed.inject(CloudSyncService);await s.start();api.saveProgress.mockRejectedValue(new CloudError('UNREACHABLE','Offline'));s.p.update('t0m0',{notes:'Keep offline'});await s.syncNow();expect(s.p.record('t0m0').notes).toBe('Keep offline');expect(s.status()).toContain('pending');expect(JSON.parse(localStorage.getItem('engineering-atlas-sync:alice')!).pending).toBe(true);
  });
  it('preserves both versions for review on concurrent saves',async()=>{
    const s=TestBed.inject(CloudSyncService);await s.start();api.saveProgress.mockRejectedValue(new CloudError('CONFLICT','Changed'));s.p.update('t0m0',{notes:'Local version'});await s.syncNow();expect(s.conflict()).toBe(true);expect(s.p.record('t0m0').notes).toBe('Local version');
  });
  it('does not overwrite a note typed while a background refresh was in flight',async()=>{
    const s=TestBed.inject(CloudSyncService);await s.start();let release!:(value:unknown)=>void;api.progress.mockImplementationOnce(()=>new Promise(resolve=>release=resolve));const pending=s.syncNow();s.p.update('t0m0',{notes:'Typed during refresh'});release({state:empty(),etag:'new-version'});await pending;expect(s.p.record('t0m0').notes).toBe('Typed during refresh');expect(s.conflict()).toBe(true);
  });
  it('reloads queued offline work before comparing server versions',async()=>{
    localStorage.setItem('engineering-atlas-v1:alice',JSON.stringify({...empty(),records:{'learning:t0m0':{notes:'Queued before closing'}}}));localStorage.setItem('engineering-atlas-sync:alice',JSON.stringify({etag:'v1',pending:true}));const s=TestBed.inject(CloudSyncService);await s.start();expect(api.saveProgress).toHaveBeenCalled();expect(s.p.record('t0m0').notes).toBe('Queued before closing');
  });
  it('never loads another account’s cached notes',async()=>{
    localStorage.setItem('engineering-atlas-v1:bob',JSON.stringify({...empty(),records:{'learning:t0m0':{notes:'Bob private'}}}));const s=TestBed.inject(CloudSyncService);await s.start();expect(JSON.stringify(s.p.state())).not.toContain('Bob private');
  });
});
