import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { AtlasState } from './models';
import { ProgressService, validateBackup } from './progress.service';
import { CourseLibraryService } from './course-library.service';
import { CloudApiService, CloudError } from './cloud-api.service';
interface SyncMetadata {etag:string|null;pending:boolean;legacyUploaded?:boolean;}
@Injectable({providedIn:'root'})
export class CloudSyncService {
  readonly api=inject(CloudApiService);readonly p=inject(ProgressService);readonly courses=inject(CourseLibraryService);
  readonly ready=signal(false);readonly status=signal('Connecting to Azure…');readonly problem=signal('');readonly conflict=signal(false);readonly legacyAvailable=signal(false);readonly busy=signal(false);
  private meta:SyncMetadata={etag:null,pending:false};private metadataKey='';private applying=false;private timer?:ReturnType<typeof setTimeout>;private inFlight?:Promise<void>;private starting?:Promise<void>;private legacy:AtlasState|null=null;
  constructor(){
    const onSave=()=>this.changed();this.p.onLocalSave=onSave;
    const online=()=>void this.syncNow();const focus=()=>{if(this.ready()&&this.api.active())void this.syncNow();};const hidden=()=>{if(document.visibilityState==='hidden'&&this.meta.pending)void this.syncNow();};
    if(typeof window!=='undefined'){window.addEventListener('online',online);window.addEventListener('focus',focus);document.addEventListener('visibilitychange',hidden);}
    inject(DestroyRef).onDestroy(()=>{clearTimeout(this.timer);if(this.p.onLocalSave===onSave)this.p.onLocalSave=undefined;if(typeof window!=='undefined'){window.removeEventListener('online',online);window.removeEventListener('focus',focus);document.removeEventListener('visibilitychange',hidden);}});
  }
  start(){return this.starting??=this.initialize().finally(()=>{this.starting=undefined;});}
  private async initialize(){
    clearTimeout(this.timer);this.ready.set(false);this.api.active.set(false);this.api.identity.set(null);this.problem.set('');this.status.set('Connecting to Azure…');
    try{const identity=await this.api.connect();this.metadataKey='engineering-atlas-sync:'+identity.owner;this.meta=this.readMeta();this.legacy=this.p.legacyState();
      this.applying=true;this.p.activateCloudScope(identity.owner);this.applying=false;await this.courses.activateCloudScope(identity.owner);const remote=await this.api.progress();
      if(this.meta.pending){if(this.meta.etag!==remote.etag){this.conflict.set(true);this.status.set('Changes need review');this.problem.set('Azure has newer progress from another device. Your device copy has been kept.');}}
      else{this.meta.etag=remote.etag;if(remote.state)this.apply(remote.state);this.writeMeta();}
      this.legacyAvailable.set(!this.meta.legacyUploaded&&((await this.courses.legacyImports()).length>0||Object.keys(this.legacy?.records??{}).length>0||Object.keys(this.legacy?.courseRecords??{}).length>0));
      this.ready.set(true);if(!this.conflict()){this.status.set(this.meta.pending?'Saved on device · upload pending':'Connected to Azure');await this.syncNow();}
    }catch(error){this.applying=false;if(typeof location!=='undefined'&&['localhost','127.0.0.1'].includes(location.hostname)){this.api.active.set(false);this.ready.set(true);this.status.set('Local development · browser storage');}else{this.status.set('Azure connection unavailable');this.problem.set(this.describe(error));}}
  }
  private readMeta():SyncMetadata{try{return JSON.parse(localStorage.getItem(this.metadataKey)??'null')??{etag:null,pending:false};}catch{return{etag:null,pending:false};}}
  private writeMeta(){try{localStorage.setItem(this.metadataKey,JSON.stringify(this.meta));}catch{this.problem.set('Device backup storage is full. Export your progress before closing.');}}
  private apply(state:AtlasState){this.applying=true;try{this.p.replaceState(validateBackup(state));}finally{this.applying=false;}}
  private changed(){if(this.applying||!this.api.active()||!this.ready())return;this.meta.pending=true;this.writeMeta();if(this.conflict())return;this.status.set(this.p.storageOK()?'Saved on device · syncing…':'Saving to Azure · device backup unavailable');clearTimeout(this.timer);this.timer=setTimeout(()=>void this.syncNow(),1200);}
  syncNow(){return this.inFlight??=this.synchronize().finally(()=>{this.inFlight=undefined;if(this.meta.pending&&!this.conflict()&&!this.problem())this.timer=setTimeout(()=>void this.syncNow(),1200);});}
  private async synchronize(){
    if(!this.api.active()||!this.ready()||this.conflict())return;this.busy.set(true);this.problem.set('');
    try{if(this.meta.pending){const state=validateBackup(this.p.state());const snapshot=JSON.stringify(state);this.status.set('Saving to Azure…');const result=await this.api.saveProgress(state,this.meta.etag);this.meta.etag=result.etag;this.meta.pending=JSON.stringify(validateBackup(this.p.state()))!==snapshot;this.writeMeta();this.status.set(this.meta.pending?'More changes queued':'Saved to Azure ✓');if(!this.meta.pending)this.p.message.set('Saved to Azure ✓');}
      else{const remote=await this.api.progress();if(this.meta.pending){if(remote.etag!==this.meta.etag)throw new CloudError('CONFLICT','Another device saved newer progress.');return;}if(remote.etag!==this.meta.etag){if(remote.state)this.apply(remote.state);this.meta.etag=remote.etag;this.writeMeta();}this.status.set('Saved to Azure ✓');this.p.message.set('Saved to Azure ✓');}
      await this.courses.syncPending();await this.courses.refreshImports();
    }catch(error){if(error instanceof CloudError&&error.code==='CONFLICT'){this.conflict.set(true);this.status.set('Changes need review');this.problem.set('Another device saved newer progress. Review which version to keep.');}else{if(error instanceof CloudError&&error.code==='SESSION_CHANGED'){this.ready.set(false);this.api.active.set(false);}this.status.set('Saved on device · Azure sync pending');this.problem.set(this.describe(error));}}finally{this.busy.set(false);}
  }
  async resolveConflict(useDevice:boolean){
    if(!confirm(useDevice?'Replace Azure progress with this device’s version? Export a progress backup first if you want to keep both.':'Use the Azure version on this device? Export your device progress first if you want to keep both.'))return;
    try{const remote=await this.api.progress();this.meta.etag=remote.etag;this.meta.pending=useDevice;if(!useDevice)this.apply(remote.state??{version:1,mode:'learning',records:{},last:null});this.conflict.set(false);this.problem.set('');this.writeMeta();await this.syncNow();}catch(error){this.problem.set(this.describe(error));}
  }
  async migrateBrowserData(){
    if(!this.api.active()||!confirm('Upload this browser’s earlier progress and imported courses to your signed-in Azure account? Matching records and course texts will use this browser’s copies. Existing browser copies are kept.'))return;
    this.busy.set(true);try{if(this.legacy)this.p.importJson(JSON.stringify(this.legacy));await this.courses.saveDocuments(await this.courses.legacyImports());this.meta.legacyUploaded=true;this.writeMeta();this.legacyAvailable.set(false);await this.syncNow();}catch(error){this.problem.set(this.describe(error));}finally{this.busy.set(false);}
  }
  private describe(error:unknown){return error instanceof Error?error.message:'Azure sync could not complete. Your device data is kept.';}
}
