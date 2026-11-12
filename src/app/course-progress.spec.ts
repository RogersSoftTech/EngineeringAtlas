import { beforeEach,describe,expect,it } from 'vitest';
import { ProgressService } from './progress.service';
import { courseCatalog } from './course-catalog';

describe('course progress and compatible backups',()=>{
  beforeEach(()=>localStorage.clear());const id=courseCatalog[0].id;
  it('restores section notes, completion and reading position',()=>{
    const p=new ProgressService();p.updateCourse(id,'module-1',{started:true,done:true,notes:'My notes',takeaway:'Apply at work',confidence:4});p.updateCourse(id,'module-2',{started:true});const r=new ProgressService();expect(r.courseRecord(id,'module-1')).toMatchObject({done:true,notes:'My notes',confidence:4});expect(r.courseResume()?.chapterId).toBe('module-2');
  });
  it('includes course progress in exports without mixing it with interview records',()=>{
    const p=new ProgressService();p.updateCourse(id,'module-1',{takeaway:'Remember this',confidence:2});p.setMode('interview');p.update('t0m0',{notes:'Practice answer'});const exported=p.exportJson();localStorage.clear();const imported=new ProgressService();imported.importJson(exported);expect(imported.courseRecord(id,'module-1').takeaway).toBe('Remember this');expect(imported.record('t0m0','interview').notes).toBe('Practice answer');
  });
  it('accepts old backups while preserving existing course notes',()=>{
    const p=new ProgressService();p.updateCourse(id,'module-1',{notes:'Keep'});p.importJson(JSON.stringify({version:1,mode:'learning',last:null,records:{'learning:t0m0':{notes:'Original'}}}));expect(p.courseRecord(id,'module-1').notes).toBe('Keep');expect(p.record('t0m0').notes).toBe('Original');
  });
  it('rejects malformed course records without modifying state',()=>{
    const p=new ProgressService();const before=p.exportJson();expect(()=>p.importJson(JSON.stringify({version:1,mode:'learning',records:{},courseRecords:{'unknown/module-1':{notes:'bad'}}}))).toThrow();expect(p.exportJson()).toBe(before);
  });
});
