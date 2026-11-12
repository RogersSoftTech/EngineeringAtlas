import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from './app.routes';
import { CourseReaderComponent } from './course-reader.component';
import { CourseLibraryService } from './course-library.service';
import { ProgressService } from './progress.service';
import { provideAtlasPrimeNG } from './prime-theme';
import { courseCatalog } from './course-catalog';
import { MarkdownComponent, cleanSourceMarkdown } from './markdown.component';

describe('course reader workflow',()=>{
  const id=courseCatalog[0].id;
  beforeEach(()=>{
    localStorage.clear();
    TestBed.configureTestingModule({providers:[provideRouter(routes),provideAtlasPrimeNG(),{provide:CourseLibraryService,useValue:{load:vi.fn().mockResolvedValue({id,messages:[{id:'source',truncated:true,markdown:'# Course\n\nCourse overview.\n\n# Module 1 — Foundations\n\nStudy this section.'}]}),refreshImports:vi.fn()}}]});
  });
  it('renders source content, marks excerpts, and persists section notes',async()=>{
    const h=await RouterTestingHarness.create();await h.navigateByUrl('/courses/'+id,CourseReaderComponent);await h.fixture.whenStable();h.detectChanges();
    expect(h.routeNativeElement!.textContent).toContain('Source excerpt · incomplete course');expect(h.routeNativeElement!.textContent).toContain('Course overview.');
    const notes=h.routeNativeElement!.querySelector<HTMLTextAreaElement>('#course-notes')!;notes.value='Apply this';notes.dispatchEvent(new Event('input'));await h.fixture.whenStable();
    expect(TestBed.inject(ProgressService).courseRecord(id,'course-overview').notes).toBe('Apply this');
    await h.navigateByUrl('/courses/'+id+'?section=module-1-foundations',CourseReaderComponent);await h.fixture.whenStable();h.detectChanges();expect(h.routeNativeElement!.textContent).toContain('Study this section.');
  });
  it('keeps imported learning text out of interview prep',async()=>{
    TestBed.inject(ProgressService).setMode('interview');const h=await RouterTestingHarness.create();await h.navigateByUrl('/courses/'+id,CourseReaderComponent);await h.fixture.whenStable();h.detectChanges();
    expect(h.routeNativeElement!.textContent).toContain('Switch to Learning');expect(h.routeNativeElement!.querySelector('#course-notes')).toBeNull();
  });
  it('sanitizes HTML and avoids loading source images',async()=>{
    const f=TestBed.createComponent(MarkdownComponent);f.componentRef.setInput('markdown','<script>alert(1)</script>\n\n<img src="https://example.com/tracker.png" onerror="alert(1)">\n\n![image](https://example.com/a.png)\n\n[suspicious](javascript:alert(1))');await f.whenStable();
    expect(f.nativeElement.querySelector('script')).toBeNull();expect(f.nativeElement.querySelector('img')).toBeNull();expect(f.nativeElement.querySelector('a')?.getAttribute('href')).not.toMatch(/^javascript:/);
  });
  it('renders entity labels and source-illustration notices without internal chat markup',()=>{
    const cleaned=cleanSourceMarkdown('Use \uE200entity\uE202["software","Apache Kafka","platform"]\uE201.\n\uE200image_group\uE202{"query":["Kafka"]}\uE201');expect(cleaned).toContain('Use Apache Kafka.');expect(cleaned).toContain('Source illustration');expect(cleaned).not.toContain('\uE200');
  });
});
