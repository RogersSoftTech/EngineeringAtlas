import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ProgressService, validateBackup } from './progress.service';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-root', imports: [RouterLink, RouterLinkActive, RouterOutlet, FormsModule, ButtonModule, SelectButtonModule, ToastModule, ConfirmDialogModule],
  providers: [MessageService, ConfirmationService],
  template: `
    <aside>
      <a class="brand" routerLink="/dashboard"><span>◈</span> ATLAS<small>ENGINEERING GROWTH</small></a>
      <p class="eyebrow">YOUR WORKSPACE</p>
      <nav aria-label="Main navigation">
        <a routerLink="/dashboard" routerLinkActive="active">▦ &nbsp; Overview</a>
        <a routerLink="/roadmaps" routerLinkActive="active">▤ &nbsp; Learning roadmaps</a>
        <a routerLink="/courses" routerLinkActive="active">▥ &nbsp; Course library</a>
        <a routerLink="/takeaways" routerLinkActive="active">✧ &nbsp; My takeaways</a>
      </nav>
      <div class="side-bottom"><b>Built for your next chapter.</b><p>Technical depth.<br>Leadership that scales.</p>
        <p-button label="Export my progress" icon="pi pi-download" size="small" (onClick)="exportBackup()" />
        <label class="import">Import backup<input type="file" accept="application/json" (change)="importBackup($event)"></label>
        <small>Saved in this browser · export to move devices.</small>
      </div>
    </aside>
    <main>
      <header><span>Personal development / <b>Your workspace</b></span><p-selectbutton [options]="modes" optionLabel="label" optionValue="value" [allowEmpty]="false" [ngModel]="p.mode()" (ngModelChange)="p.setMode($event)" ariaLabel="Study mode" /></header>
      @if (!p.storageOK()) { <div class="notice" role="alert">{{p.message()}}</div> }
      <router-outlet />
      <footer>ENGINEERING ATLAS <span>Small steps. Compounding growth.</span></footer>
    </main>
    <p-toast /><p-confirmdialog />
  `
})
export class AppComponent {
  readonly p = inject(ProgressService);
  private readonly messages = inject(MessageService);
  private readonly confirmation = inject(ConfirmationService);
  readonly modes = [{ label: 'Learning', value: 'learning' }, { label: 'Interview Prep', value: 'interview' }];
  exportBackup() {
    const url = URL.createObjectURL(new Blob([this.p.exportJson()], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'engineering-atlas-backup.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.messages.add({ severity: 'success', summary: 'Backup exported', detail: 'Keep this file to restore your progress on another device.' });
  }
  async importBackup(event: Event) {
    const input = event.target as HTMLInputElement;
    try {
      const file = input.files?.[0]; if (!file) return;
      if (file.size > 5_000_000) throw new Error('Too large');
      const text = await file.text(); validateBackup(JSON.parse(text));
      this.confirmation.confirm({
        header: 'Import progress backup?', message: 'Matching modules will use the imported record. Other progress will be kept.',
        icon: 'pi pi-question-circle', acceptLabel: 'Import backup', rejectLabel: 'Cancel',
        accept: () => {
          this.p.importJson(text);
          this.messages.add({ severity: 'success', summary: 'Backup imported', detail: 'Your progress is ready.' });
        }
      });
    } catch { this.messages.add({ severity: 'error', summary: 'Invalid backup', detail: 'Your progress was kept.' }); }
    finally { input.value = ''; }
  }
}
