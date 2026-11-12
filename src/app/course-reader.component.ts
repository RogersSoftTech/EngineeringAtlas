import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ProgressBarModule } from 'primeng/progressbar';
import { courseCatalog } from './course-catalog';
import { courseChapters } from './course-content';
import { CourseDocument, CourseChapter } from './course.models';
import { CourseLibraryService } from './course-library.service';
import { ProgressService } from './progress.service';
import { Progress } from './models';
import { MarkdownComponent } from './markdown.component';

@Component({selector:'atlas-course-reader',imports:[RouterLink,FormsModule,ButtonModule,TextareaModule,SelectModule,ProgressBarModule,MarkdownComponent],template:`
  <a class="back" routerLink="/courses">← Course library</a>
  @if (course(); as c) {
    <div class="intro"><div class="tag">{{c.track==='quick'?'QUICK COURSE':'DEEP DIVE'}} · LEARNING CONTENT</div><h1>{{c.topic}}</h1><p>{{c.title}} · <a [href]="c.sourceUrl" target="_blank" rel="noreferrer">Open original chat ↗</a></p></div>
    @if (error()) { <div class="notice" role="alert">{{error()}} <p-button label="Retry" (onClick)="retry()" /></div> }
    @if (loading()) { <p role="status">Loading course content…</p> }
    @if (document(); as doc) {
      @if (partial()) { <div class="notice source-notice"><b>Source excerpt · incomplete course</b><p>This chat reply exceeded the reader’s limit. Only the available text is included, and the last section may end mid-explanation. Completion tracks the sections shown here. Import your full ChatGPT export in the course library or open the original chat to continue. Source illustrations and attachments are not included.</p></div> }
      @else { <p class="muted">Imported chat text · Source illustrations and attachments remain in the original chat.</p> }
      @if (p.mode()==='interview') { <div class="panel"><h2>This is learning content.</h2><p>Course reading and reflections belong to Learning. Interview Prep retains your independent roadmap practice.</p><p-button label="Switch to Learning" (onClick)="p.setMode('learning')" /></div> }
      @else { <div class="course-reader-layout"><nav class="course-contents" aria-label="Course sections"><h3>In this course</h3><p-progressbar [value]="percent()" [showValue]="false" /><p class="muted">{{completeCount()}} / {{chapters().length}} available sections complete</p>
        @for (ch of chapters();track ch.id;let i=$index) { <a class="button" [class.active]="ch.id===chapter()?.id" [attr.aria-current]="ch.id===chapter()?.id?'page':null" [routerLink]="['/courses',c.id]" [queryParams]="{section:ch.id}">{{p.courseRecord(c.id,ch.id).done?'✓':i+1}} · {{ch.title}}</a> }
      </nav><article class="panel lesson course-reading">
        @if (chapter();as ch) {
          <atlas-markdown [markdown]="ch.markdown" />
          <section class="course-reflection"><div class="tag">MAKE IT YOURS</div><h2>Reflection & application</h2><p class="muted">Record your own interpretation, an experiment to try, or a question to revisit.</p>
            <label for="course-notes">Section notes</label><textarea pTextarea id="course-notes" [ngModel]="record().notes??''" (ngModelChange)="edit('notes',$event)" placeholder="What changed your understanding?"></textarea>
            <label for="course-work">Practical application / evidence</label><textarea pTextarea id="course-work" [ngModel]="record().work??''" (ngModelChange)="edit('work',$event)" placeholder="How will you apply this at work?"></textarea>
            <label for="course-takeaway">Key takeaway</label><textarea pTextarea id="course-takeaway" [ngModel]="record().takeaway??''" (ngModelChange)="edit('takeaway',$event)"></textarea>
            <label for="course-confidence">Confidence</label><p-select inputId="course-confidence" ariaLabel="Course section confidence" [options]="confidence" optionLabel="label" optionValue="value" [ngModel]="record().confidence??0" (ngModelChange)="edit('confidence',$event)" appendTo="body" />
            <p class="save-status" role="status">{{p.message()}}</p><div class="actions"><p-button [label]="record().done?'Completed · mark unfinished':'Mark section complete'" icon="pi pi-check" (onClick)="edit('done',!record().done)" />@if(nextChapter();as next){<p-button label="Next section" icon="pi pi-arrow-right" severity="secondary" (onClick)="go(next.id)" />}</div>
          </section>
        }
      </article></div> }
    }
  } @else { <h1>Course not found</h1><p>Choose a source conversation from the course library.</p> }
`})
export class CourseReaderComponent {
  readonly p=inject(ProgressService);private readonly library=inject(CourseLibraryService);private readonly router=inject(Router);private readonly route=inject(ActivatedRoute);
  private readonly params=toSignal(this.route.paramMap);private readonly query=toSignal(this.route.queryParamMap);
  readonly course=computed(()=>courseCatalog.find(c=>c.id===this.params()?.get('id')));
  readonly document=signal<CourseDocument|null>(null);readonly loading=signal(false);readonly error=signal('');private readonly attempt=signal(0);
  readonly chapters=computed(()=>this.document()?courseChapters(this.document()!):[]);
  readonly chapter=computed<CourseChapter|undefined>(()=>this.chapters().find(ch=>ch.id===this.query()?.get('section'))??this.chapters()[0]);
  readonly nextChapter=computed<CourseChapter|undefined>(()=>this.chapters()[this.chapters().findIndex(ch=>ch.id===this.chapter()?.id)+1]);
  readonly partial=computed(()=>this.document()?.messages.some(m=>m.truncated));
  readonly record=computed(()=>this.course()&&this.chapter()?this.p.courseRecord(this.course()!.id,this.chapter()!.id):{});
  readonly confidence=[{label:'Not assessed',value:0},{label:'1 · Need guidance',value:1},{label:'2 · Developing',value:2},{label:'3 · Can apply with support',value:3},{label:'4 · Independent',value:4},{label:'5 · Can teach',value:5}];
  constructor(){
    effect(onCleanup=>{const c=this.course();this.attempt();this.document.set(null);this.error.set('');if(!c)return;this.loading.set(true);const abort=new AbortController();onCleanup(()=>abort.abort());
      void this.library.load(c.id,abort.signal).then(doc=>{if(!abort.signal.aborted)this.document.set(doc);}).catch(error=>{if(!abort.signal.aborted)this.error.set(error instanceof Error?error.message:'Unable to load course.');}).finally(()=>{if(!abort.signal.aborted)this.loading.set(false);});
    });
    effect(()=>{const c=this.course(),ch=this.chapter(),mode=this.p.mode();if(c&&ch&&mode==='learning')untracked(()=>this.p.updateCourse(c.id,ch.id,{started:true}));});
  }
  retry(){this.attempt.update(n=>n+1);}
  edit(field:keyof Progress,value:string|number|boolean){const c=this.course(),ch=this.chapter();if(c&&ch)this.p.updateCourse(c.id,ch.id,{[field]:value});}
  go(id:string){void this.router.navigate(['/courses',this.course()!.id],{queryParams:{section:id}});}
  completeCount(){return this.chapters().filter(ch=>this.p.courseRecord(this.course()!.id,ch.id).done).length;}
  percent(){return this.chapters().length?Math.round(this.completeCount()/this.chapters().length*100):0;}
}
