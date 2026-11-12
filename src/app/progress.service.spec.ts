import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProgressService, STORAGE_KEY, modules, validateBackup } from './progress.service';
import { topics } from './curriculum';

describe('curriculum and persistent progress', () => {
  beforeEach(() => localStorage.clear());
  it('contains all 13 roadmaps and 39 distinct, complete modules', () => {
    expect(topics).toHaveLength(13); expect(modules).toHaveLength(39);
    expect(new Set(modules.map(m => m.id)).size).toBe(39);
    for (const m of modules) for (const key of ['content','example','exercise','question','rubric'] as const) expect(m[key].length).toBeGreaterThan(20);
  });
  it('restores notes, evidence, takeaways, confidence and completion after a reload', () => {
    const p = new ProgressService(); p.visit('t0m0');
    p.update('t0m0', { notes: 'Use domain boundaries', work: 'ADR-001', takeaway: 'Start modular', confidence: 4 });
    p.toggleComplete('t0m0');
    const restored = new ProgressService();
    expect(restored.record('t0m0')).toMatchObject({ notes:'Use domain boundaries',work:'ADR-001',takeaway:'Start modular',confidence:4,done:true,started:true });
    expect(restored.strengths().map(m => m.id)).toContain('t0m0');
    expect(restored.takeaways()).toHaveLength(1);
  });
  it('keeps learning and interview progress independent', () => {
    const p = new ProgressService(); p.update('t0m0', {notes:'learning', done:true});
    p.setMode('interview'); expect(p.record('t0m0').done).toBeUndefined();
    p.update('t0m0', {notes:'practice', confidence:2});
    expect(p.gaps()).toHaveLength(1); p.setMode('learning');
    expect(p.record('t0m0').notes).toBe('learning'); expect(p.gaps()).toHaveLength(0);
  });
  it('resumes unfinished work and excludes completed modules from recommendations', () => {
    const p = new ProgressService(); p.visit('t5m2');
    expect(p.resume()?.id).toBe('t5m2'); expect(p.recommendations()[0].id).toBe('t5m2');
    p.toggleComplete('t5m2'); expect(p.recommendations().some(m => m.id==='t5m2')).toBe(false);
    p.toggleComplete('t5m2'); expect(p.recommendations()[0].id).toBe('t5m2');
  });
  it('prioritizes assessed gaps above untouched work, without inventing gaps', () => {
    const p = new ProgressService(); expect(p.gaps()).toHaveLength(0); expect(p.assessed()).toHaveLength(0);
    p.update('t9m0', { confidence:1 }); expect(p.recommendations()[0].id).toBe('t9m0');
  });
  it('imports original-site backups and merges while retaining unrelated records', () => {
    const p = new ProgressService(); p.update('t0m1',{notes:'keep'});
    p.importJson(JSON.stringify({version:1,mode:'learning',last:null,records:{'learning:t0m0':{notes:'original site',done:true}}}));
    expect(p.record('t0m0').notes).toBe('original site'); expect(p.record('t0m1').notes).toBe('keep');
    expect(validateBackup(JSON.parse(p.exportJson())).records['learning:t0m0'].done).toBe(true);
  });
  it('rejects invalid imports without modifying progress', () => {
    const p = new ProgressService(); p.update('t0m0',{notes:'keep'}); const before=p.exportJson();
    for(const bad of ['{}','null','{"version":1,"mode":"learning","records":{"learning:unknown":{}}}', '{"version":1,"mode":"learning","records":{"learning:t0m0":{"confidence":9}}}']) expect(()=>p.importJson(bad)).toThrow();
    expect(p.exportJson()).toBe(before);
  });
  it('keeps in-memory work and shows a warning when storage fails', () => {
    const p=new ProgressService(); const spy=vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('Quota')});
    p.update('t0m0',{notes:'export me'}); expect(p.storageOK()).toBe(false); expect(p.exportJson()).toContain('export me'); spy.mockRestore();
  });
  it('handles corrupt stored data without crashing', () => {
    localStorage.setItem(STORAGE_KEY,'bad json'); const p = new ProgressService(); expect(p.storageOK()).toBe(false); expect(p.completed()).toHaveLength(0);
  });
});
