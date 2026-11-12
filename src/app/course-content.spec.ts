import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { courseCatalog } from './course-catalog';
import { courseChapters, parseCourseExport, validateCourseDocument } from './course-content';

const id=courseCatalog[0].id;
export const exportFixture = [{id,title:courseCatalog[0].title,current_node:'a2',mapping:{
  u:{id:'u',parent:null,message:{id:'u',author:{role:'user'},content:{content_type:'text',parts:['Do not import my private prompt']}}},
  a1:{id:'a1',parent:'u',message:{id:'a1',author:{role:'assistant'},content:{content_type:'text',parts:['# Course\n\nOverview\n\n# Module 1 — Foundations\n\nComplete lesson.']}}},
  discarded:{id:'discarded',parent:'u',message:{id:'discarded',author:{role:'assistant'},content:{content_type:'text',parts:['Inactive branch']}}},
  a2:{id:'a2',parent:'a1',message:{id:'a2',author:{role:'assistant'},content:{content_type:'text',parts:['# Module 2 — Practice\n\nPractice content.']}}}
}}];

describe('course source integration',()=>{
  it('packages all 50 matching chats with honest completeness flags and valid chapter IDs',()=>{
    expect(courseCatalog).toHaveLength(50); expect(courseCatalog.filter(c=>c.track==='quick')).toHaveLength(24); expect(courseCatalog.filter(c=>c.track==='deep')).toHaveLength(26);
    expect(new Set(courseCatalog.map(c=>c.id)).size).toBe(50);
    for(const summary of courseCatalog){const d=validateCourseDocument(JSON.parse(readFileSync('public/courses/'+summary.id+'.json','utf8')));expect(d.id).toBe(summary.id);expect(d.messages.some(m=>m.truncated)).toBe(summary.partial);const chapters=courseChapters(d);expect(chapters.length).toBeGreaterThan(0);expect(new Set(chapters.map(c=>c.id)).size).toBe(chapters.length);for(const c of chapters)expect(c.id).toMatch(/^[a-z0-9-]{1,140}$/);}
  });
  it('keeps chapter identifiers stable when full text replaces an excerpt',()=>{
    const original={id,messages:[{id:'msg',markdown:'# Course\n\nOverview\n\n# Module 1 — Foundation\n\nFirst paragraph.',truncated:true}]};
    const full={...original,messages:[{...original.messages[0],markdown:original.messages[0].markdown+'\n\nThe rest of the lesson.\n\n# Module 2 — Practice\n\nMore material.',truncated:false}]};
    expect(courseChapters(full).slice(0,2).map(c=>c.id)).toEqual(courseChapters(original).map(c=>c.id));
  });
  it('does not split headings inside fenced code blocks',()=>{
    const ch=courseChapters({id,messages:[{id:'m',markdown:'Introduction\n\n```text\n# Module 1 — fake\n```\n\n# Module 1 — Real\n\nBody.',truncated:false}]});expect(ch).toHaveLength(2);expect(ch[0].markdown).toContain('fake');expect(ch[1].title).toContain('Real');
  });
  it('imports only assistant text from the active conversation branch',()=>{
    const docs=parseCourseExport(exportFixture);expect(docs).toHaveLength(1);expect(docs[0].messages).toHaveLength(2);expect(docs[0].messages.every(m=>!m.truncated)).toBe(true);expect(JSON.stringify(docs)).not.toContain('private prompt');expect(JSON.stringify(docs)).not.toContain('Inactive branch');
  });
  it('matches renamed chats by source ID and known titles by title',()=>{
    expect(parseCourseExport([{...exportFixture[0],title:'renamed'}])[0].id).toBe(id);
    expect(parseCourseExport([{...exportFixture[0],id:'different-id'}])[0].id).toBe(id);
  });
  it('rejects exports without recognized course content',()=>{
    expect(()=>parseCourseExport([{id:'other',title:'other',mapping:{}}])).toThrow();expect(()=>parseCourseExport({})).toThrow();expect(()=>validateCourseDocument({id:'other',messages:[{id:'m',markdown:'text'}]})).toThrow();
  });
});
