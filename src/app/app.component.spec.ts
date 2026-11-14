import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from './app.routes';
import { ModuleComponent } from './module.component';
import { RoadmapsComponent } from './roadmaps.component';
import { ProgressService } from './progress.service';
import { provideAtlasPrimeNG } from './prime-theme';
import { AppComponent } from './app.component';
import { CloudSyncService } from './cloud-sync.service';
import { signal } from '@angular/core';

describe('Angular navigation and forms', () => {
  beforeEach(() => {localStorage.clear(); TestBed.configureTestingModule({providers:[provideRouter(routes), provideAtlasPrimeNG()]});});
  it('provides a link back to the Rogers Soft Tech home page', () => {
    TestBed.overrideProvider(CloudSyncService, { useValue: {
      start: vi.fn(), ready: signal(true), status: signal(''), problem: signal(''),
      api: { active: signal(false), identity: signal(null) },
      courses: { pendingCount: signal(0) }, conflict: signal(false), legacyAvailable: signal(false)
    } });
    const fixture=TestBed.createComponent(AppComponent); fixture.detectChanges();
    const link=fixture.nativeElement.querySelector('nav a[href="https://rogers-soft-tech.com/home"]') as HTMLAnchorElement | null;
    expect(link?.textContent).toContain('Rogers Soft Tech home');
  });
  it('filters roadmap cards through the rendered search field', async () => {
    const h=await RouterTestingHarness.create(); await h.navigateByUrl('/roadmaps',RoadmapsComponent);
    expect(h.routeNativeElement!.querySelectorAll('atlas-topic-card')).toHaveLength(13);
    const input=h.routeNativeElement!.querySelector('input')!; input.value='Kubernetes'; input.dispatchEvent(new Event('input')); h.detectChanges();
    expect(h.routeNativeElement!.querySelectorAll('atlas-topic-card')).toHaveLength(1);
    expect(h.routeNativeElement!.textContent).toContain('Kubernetes');
  });
  it('saves typed notes and switches to independent interview fields', async () => {
    const h=await RouterTestingHarness.create(); await h.navigateByUrl('/module/t0m0',ModuleComponent);
    const notes=h.routeNativeElement!.querySelector<HTMLTextAreaElement>('#notes')!;
    notes.value='Architecture evidence'; notes.dispatchEvent(new Event('input')); await h.fixture.whenStable();
    const p=TestBed.inject(ProgressService); expect(p.record('t0m0').notes).toBe('Architecture evidence');
    p.setMode('interview'); await h.fixture.whenStable(); h.detectChanges();
    expect(h.routeNativeElement!.textContent).toContain('PRACTICE PROMPT');
    expect(h.routeNativeElement!.querySelector<HTMLTextAreaElement>('#notes')!.value).toBe('');
    p.setMode('learning'); await h.fixture.whenStable(); h.detectChanges();
    expect(h.routeNativeElement!.querySelector<HTMLTextAreaElement>('#notes')!.value).toBe('Architecture evidence');
  });
  it('updates reused module routes and handles unknown IDs', async () => {
    const h=await RouterTestingHarness.create(); await h.navigateByUrl('/module/t0m0',ModuleComponent);
    await h.navigateByUrl('/module/t1m0',ModuleComponent); expect(h.routeNativeElement!.textContent).toContain('Consistency & transactions');
    await h.navigateByUrl('/module/unknown',ModuleComponent); expect(h.routeNativeElement!.textContent).toContain('Module not found');
  });
});
