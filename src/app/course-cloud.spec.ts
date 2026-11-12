import { signal } from '@angular/core';
import { IDBFactory } from 'fake-indexeddb';
import { afterEach,beforeEach,describe,expect,it,vi } from 'vitest';
import { CourseLibraryService } from './course-library.service';
import { CloudApiService,CloudError } from './cloud-api.service';
import { courseCatalog } from './course-catalog';
describe('cloud-backed full course text',()=>{
  const id=courseCatalog[0].id;const doc={id,messages:[{id:'m',markdown:'My complete course text.',truncated:false}]};let api:any;let server:Map<string,{document:unknown;etag:string}>;let account:string;
  beforeEach(()=>{vi.stubGlobal('indexedDB',new IDBFactory());account='alice';server=new Map();api={active:signal(true),course:vi.fn(async(id:string)=>server.get(account+'/'+id)??{document:null,etag:null}),courses:vi.fn(async()=>({courses:[...server.entries()].filter(([k])=>k.startsWith(account+'/')).map(([k,v])=>({id:k.split('/')[1],etag:v.etag}))})),saveCourse:vi.fn(async(d:any,etag:string|null)=>{const key=account+'/'+d.id;const existing=server.get(key);if((existing?.etag??null)!==etag)throw new CloudError('CONFLICT','Changed elsewhere');const next={document:d,etag:crypto.randomUUID()};server.set(key,next);return{etag:next.etag};})};});
  afterEach(()=>vi.unstubAllGlobals());
  it('makes a full import available to a fresh device without another export import',async()=>{
    const first=new CourseLibraryService(api as CloudApiService);await first.activateCloudScope('alice');await first.importExport(JSON.stringify(doc));expect(first.pendingCount()).toBe(0);
    vi.stubGlobal('indexedDB',new IDBFactory());const second=new CourseLibraryService(api as CloudApiService);await second.activateCloudScope('alice');expect(second.importedIds()).toContain(id);expect(await second.load(id)).toEqual(doc);
  });
  it('separates cached course lists when the signed-in account changes',async()=>{
    const s=new CourseLibraryService(api as CloudApiService);await s.activateCloudScope('alice');await s.importExport(JSON.stringify(doc));account='bob';await s.activateCloudScope('bob');expect(s.importedIds()).toEqual([]);expect(server.has('bob/'+id)).toBe(false);
  });
  it('retains a failed import for a later retry',async()=>{
    const s=new CourseLibraryService(api as CloudApiService);await s.activateCloudScope('alice');api.saveCourse.mockRejectedValueOnce(new CloudError('UNREACHABLE','Offline'));await s.importExport(JSON.stringify(doc));expect(s.pendingCount()).toBe(1);expect(await s.load(id)).toEqual(doc);await s.syncPending();expect(s.pendingCount()).toBe(0);expect(server.get('alice/'+id)?.document).toEqual(doc);
  });
  it('does not silently replace a course changed after an offline import',async()=>{
    const s=new CourseLibraryService(api as CloudApiService);await s.activateCloudScope('alice');api.saveCourse.mockRejectedValueOnce(new CloudError('UNREACHABLE','Offline'));await s.importExport(JSON.stringify(doc));server.set('alice/'+id,{document:{...doc,messages:[{...doc.messages[0],markdown:'Other device'}]},etag:'newer'});await s.syncPending();expect(s.pendingCount()).toBe(1);expect(s.syncMessage()).toContain('another device');expect((server.get('alice/'+id)?.document as any).messages[0].markdown).toBe('Other device');expect(await s.load(id)).toEqual(doc);
  });
});
