import { Injectable, signal } from '@angular/core';
import { CourseDocument } from './course.models';
import { validateCourseDocument, parseCourseExport } from './course-content';

const DATABASE = 'engineering-atlas-course-content';
const STORE = 'courses';

@Injectable({ providedIn:'root' })
export class CourseLibraryService {
  readonly importedIds = signal<string[]>([]);
  private database?: Promise<IDBDatabase>;
  private open() {
    return this.database ??= new Promise<IDBDatabase>((resolve,reject) => {
      const request = indexedDB.open(DATABASE,1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE,{keyPath:'id'});
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Course storage is unavailable'));
    });
  }
  async refreshImports() {
    try {
      const db = await this.open();
      const keys = await new Promise<IDBValidKey[]>((resolve,reject) => {
        const r=db.transaction(STORE).objectStore(STORE).getAllKeys(); r.onsuccess=()=>resolve(r.result); r.onerror=()=>reject(r.error);
      });
      this.importedIds.set(keys.map(String));
    } catch { /* Bundled excerpts still work if browser database access is unavailable. */ }
  }
  async load(id: string, signal?: AbortSignal): Promise<CourseDocument> {
    let imported: unknown;
    try {
      const db = await this.open();
      imported = await new Promise((resolve,reject) => { const r=db.transaction(STORE).objectStore(STORE).get(id); r.onsuccess=()=>resolve(r.result); r.onerror=()=>reject(r.error); });
    } catch { /* Fall back to the packaged source snapshot. */ }
    if (imported) return validateCourseDocument(imported);
    const response = await fetch(new URL('courses/'+encodeURIComponent(id)+'.json',document.baseURI),{signal});
    if (!response.ok) throw new Error('Unable to load this course. Please retry.');
    return validateCourseDocument(await response.json());
  }
  async importExport(text: string) {
    const documents = parseCourseExport(JSON.parse(text));
    const db = await this.open();
    await new Promise<void>((resolve,reject) => {
      const tx=db.transaction(STORE,'readwrite');
      for (const doc of documents) tx.objectStore(STORE).put(doc);
      tx.oncomplete=()=>resolve(); tx.onerror=()=>reject(new Error('Import could not be saved. Your previous course content was kept.')); tx.onabort=()=>reject(new Error('Import was not saved.'));
    });
    await this.refreshImports();
    return documents.length;
  }
}
