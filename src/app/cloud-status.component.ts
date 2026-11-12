import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CloudSyncService } from './cloud-sync.service';
import { RouterLink } from '@angular/router';
@Component({selector:'atlas-cloud-status',imports:[ButtonModule,RouterLink],template:`
  <section class="cloud-status" aria-label="Cloud saving status">
    <a class="cloud-lab-link" routerLink="/storage-lab">Learn how cloud saving works ↗</a>
    <div class="cloud-status-line"><span><b>{{sync.status()}}</b>@if(sync.api.identity();as identity){<span class="muted"> · {{identity.displayName}}</span>}</span><div class="actions">@if(sync.ready()&&sync.api.active()){<p-button label="Sync now" icon="pi pi-cloud" size="small" severity="secondary" [disabled]="sync.busy()||sync.conflict()" (onClick)="sync.syncNow()"/>}@else{<p-button label="Retry connection" size="small" (onClick)="sync.start()"/>}</div></div>
    @if(sync.problem()){<p role="alert">{{sync.problem()}} @if(!sync.ready()){<a href="/login">Sign in again</a>}</p>}
    @if(sync.courses.pendingCount()){<p role="status">{{sync.courses.pendingCount()}} imported course texts still need to upload. {{sync.courses.syncMessage()}}</p>}
    @if(sync.conflict()){<div class="actions"><p-button label="Use Azure version" severity="secondary" (onClick)="sync.resolveConflict(false)"/><p-button label="Keep this device’s version" (onClick)="sync.resolveConflict(true)"/></div>}
    @if(sync.legacyAvailable()){<div class="cloud-migration"><b>Bring your earlier browser data into Azure</b><p>Your previous browser-only notes, progress and imported courses are still on this device. Upload them once to make them available on your other devices.</p><p-button label="Upload browser data to my account" icon="pi pi-cloud-upload" [disabled]="sync.busy()||sync.conflict()" (onClick)="sync.migrateBrowserData()"/></div>}
  </section>
`})
export class CloudStatusComponent {readonly sync=inject(CloudSyncService);}
