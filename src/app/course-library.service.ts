import { Injectable, Optional, signal } from '@angular/core';
import { CourseDocument } from './course.models';
import { validateCourseDocument, parseCourseExport } from './course-content';
import { CloudApiService, CloudError } from './cloud-api.service';
const DATABASE='engineering-atlas-course-content';const STORE='courses';
interface CachedCourse extends CourseDocument { cloudEtag?:string|null; pending?:boolean; localRevision?:string; }
@Injectable({providedIn:'root'})
export class CourseLibraryService {
  readonly importedIds=signal<string[]>([]);readonly pendingCount=signal(0);readonly syncMessage=signal('');readonly revision=signal(0);
  private scope='';private database?:Promise<IDBDatabase>;private syncing?:Promise<void>;private remoteVersions='';
  constructor(@Optional() private readonly cloud:CloudApiService|null=null){}
  private open(){return this.database??=this.openDatabase(DATABASE+(this.scope?':'+this.scope:''));}
  private openDatabase(name:string){return new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open(name,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE,{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(new Error('Device course storage is unavailable.'));});}
  async activateCloudScope(owner:string){this.scope=owner;this.database=undefined;this.remoteVersions='';this.importedIds.set([]);await this.refreshImports();}
  private async cached(id:string):Promise<CachedCourse|undefined>{try{const db=await this.open();return await new Promise((resolve,reject)=>{const r=db.transaction(STORE).objectStore(STORE).get(id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}catch{return undefined;}}
  private async all(database?:IDBDatabase):Promise<CachedCourse[]>{const db=database??await this.open();return new Promise((resolve,reject)=>{const r=db.transaction(STORE).objectStore(STORE).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
  private async put(doc:CachedCourse){const db=await this.open();await new Promise<void>((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(doc);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(new Error('Could not keep a device copy.'));tx.onabort=()=>reject(new Error('Device save was interrupted.'));});}
  async legacyImports():Promise<CourseDocument[]>{try{return (await this.all(await this.openDatabase(DATABASE))).map(validateCourseDocument);}catch{return [];}}
  async refreshImports(){
    let local:CachedCourse[]=[];try{local=await this.all();}catch{}
    const ids=new Set(local.map(d=>d.id));this.pendingCount.set(local.filter(d=>d.pending).length);
    if(this.cloud?.active())try{const remote=await this.cloud.courses();for(const c of remote.courses)ids.add(c.id);const versions=JSON.stringify([...remote.courses].sort((a,b)=>a.id.localeCompare(b.id)));if(versions!==this.remoteVersions){this.remoteVersions=versions;this.revision.update(n=>n+1);}}catch{this.syncMessage.set('Course sync is unavailable. Device copies are kept.');}
    this.importedIds.set([...ids]);
  }
  async load(id:string,signal?:AbortSignal):Promise<CourseDocument>{
    const cached=await this.cached(id);if(cached?.pending)return validateCourseDocument(cached);
    if(this.cloud?.active())try{const remote=await this.cloud.course(id);const latest=await this.cached(id);if(latest?.pending)return validateCourseDocument(latest);if(remote.document){const doc=validateCourseDocument(remote.document);try{await this.put({...doc,cloudEtag:remote.etag,pending:false});}catch{}return doc;}}
    catch(error){if(error instanceof CloudError&&error.code==='SESSION_CHANGED')throw error;this.syncMessage.set('Reading the device copy while Azure is unavailable.');}
    if(cached)return validateCourseDocument(cached);const response=await fetch(new URL('courses/'+encodeURIComponent(id)+'.json',document.baseURI),{signal});if(!response.ok)throw new Error('Unable to load this course. Please retry.');return validateCourseDocument(await response.json());
  }
  async importExport(text:string){const documents=parseCourseExport(JSON.parse(text));await this.saveDocuments(documents);return documents.length;}
  async saveDocuments(documents:CourseDocument[]){
    for(const raw of documents){const doc=validateCourseDocument(raw);const previous=await this.cached(doc.id);let etag=previous?.cloudEtag??null;
      // Explicit imports may replace the current cloud text. Automatic retries retain the original version condition.
      if(this.cloud?.active())try{etag=(await this.cloud.course(doc.id)).etag;}catch{}
      try{await this.put({...doc,cloudEtag:etag,pending:!!this.cloud?.active()||!!this.scope,localRevision:crypto.randomUUID()});}
      catch(error){if(!this.cloud?.active())throw error;await this.cloud.saveCourse(doc,etag);this.syncMessage.set('Course text saved to Azure; the device cache is unavailable.');}}
    await this.syncPending();await this.refreshImports();this.revision.update(n=>n+1);if(!this.cloud?.active())this.syncMessage.set(this.scope?'Imported on this device. Upload to Azure is pending.':'Imported in this browser.');
  }
  syncPending(){return this.syncing??=this.flush().finally(()=>{this.syncing=undefined;});}
  private async flush(){
    if(!this.cloud?.active())return;let records:CachedCourse[];try{records=await this.all();}catch{return;}let failed=0;
    for(const record of records.filter(d=>d.pending))try{const result=await this.cloud.saveCourse(validateCourseDocument(record),record.cloudEtag??null);const latest=await this.cached(record.id);if(latest)await this.put({...latest,cloudEtag:result.etag,pending:latest.localRevision!==record.localRevision});}
    catch(error){failed++;this.syncMessage.set(error instanceof CloudError&&error.code==='CONFLICT'?'A course changed on another device. Your copy is kept; re-import that course while online to deliberately replace the Azure version.':error instanceof Error?error.message:'Course upload is pending.');}
    const pending=(await this.all()).filter(d=>d.pending).length;this.pendingCount.set(pending);if(!pending)this.syncMessage.set('Imported course texts saved to Azure ✓');else if(!failed)this.syncMessage.set('Newer course imports are queued for Azure.');
  }
}
