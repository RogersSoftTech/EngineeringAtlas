import { Injectable, signal } from '@angular/core';
import { AtlasState } from './models';
import { CourseDocument } from './course.models';
export interface CloudIdentity { owner:string; displayName:string; storage:string; }
export interface CloudProgress { state:AtlasState|null; etag:string|null; }
export class CloudError extends Error { constructor(readonly code:string,message:string,readonly status=0){super(message);} }
@Injectable({providedIn:'root'})
export class CloudApiService {
  readonly identity=signal<CloudIdentity|null>(null);readonly active=signal(false);
  async connect(){const identity=await this.request<CloudIdentity>('session');this.identity.set(identity);this.active.set(true);return identity;}
  progress(){return this.request<CloudProgress>('progress');}
  saveProgress(state:AtlasState,etag:string|null){return this.request<{etag:string}>('progress','PUT',state,etag);}
  courses(){return this.request<{courses:{id:string;etag:string}[]}>('courses');}
  course(id:string){return this.request<{document:CourseDocument|null;etag:string|null}>('courses/'+encodeURIComponent(id));}
  saveCourse(document:CourseDocument,etag:string|null){return this.request<{etag:string}>('courses/'+encodeURIComponent(document.id),'PUT',document,etag);}
  private async request<T>(resource:string,method='GET',body?:unknown,etag?:string|null):Promise<T>{
    const headers:Record<string,string>={Accept:'application/json'};const identity=this.identity();if(identity)headers['X-Atlas-Owner']=identity.owner;
    if(body!==undefined){headers['Content-Type']='application/json';if(etag)headers['If-Match']=etag;else headers['If-None-Match']='*';}
    const serialized=body===undefined?undefined:JSON.stringify(body);
    let response:Response;try{response=await fetch('/api/learning/'+resource,{method,headers,body:serialized,keepalive:!!serialized&&new TextEncoder().encode(serialized).byteLength<60000,credentials:'same-origin',redirect:'error',signal:AbortSignal.timeout(25000)});}catch{throw new CloudError('UNREACHABLE','Azure sync is unavailable. Your device copy is kept.');}
    if(!response.headers.get('content-type')?.includes('application/json'))throw new CloudError('NOT_AVAILABLE','Cloud storage is not available on this address.',response.status);
    const data=await response.json();if(!response.ok)throw new CloudError(data.code??'REQUEST_FAILED',data.message??'Azure sync could not complete.',response.status);
    if(identity&&data.owner!==identity.owner)throw new CloudError('SESSION_CHANGED','The signed-in account changed. Reload before saving.');return data as T;
  }
}
