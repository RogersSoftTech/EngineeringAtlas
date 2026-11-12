import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { CourseLibraryService } from './course-library.service';
import { courseCatalog } from './course-catalog';

describe('browser-local full course imports',()=>{
  beforeEach(()=>vi.stubGlobal('indexedDB',new IDBFactory()));
  afterEach(()=>vi.unstubAllGlobals());
  it('persists full course replacements across service reloads',async()=>{
    const doc={id:courseCatalog[0].id,messages:[{id:'msg',markdown:'# Complete course\n\nAll of my imported content.',truncated:false}]};
    const s=new CourseLibraryService();expect(await s.importExport(JSON.stringify(doc))).toBe(1);
    const reloaded=new CourseLibraryService();await reloaded.refreshImports();expect(reloaded.importedIds()).toContain(doc.id);expect(await reloaded.load(doc.id)).toEqual(doc);
  });
  it('does not replace saved content on an invalid import',async()=>{
    const doc={id:courseCatalog[0].id,messages:[{id:'msg',markdown:'Existing text',truncated:false}]};
    const s=new CourseLibraryService();await s.importExport(JSON.stringify(doc));await expect(s.importExport('{}')).rejects.toThrow();expect(await s.load(doc.id)).toEqual(doc);
  });
});
