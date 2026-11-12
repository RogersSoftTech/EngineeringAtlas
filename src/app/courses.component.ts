import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ButtonModule } from 'primeng/button';
import { courseCatalog } from './course-catalog';
import { CourseLibraryService } from './course-library.service';
import { ProgressService } from './progress.service';
import { topics } from './curriculum';

@Component({ selector:'atlas-courses', imports:[RouterLink,FormsModule,InputTextModule,SelectButtonModule,ButtonModule], template:`
  <div class="intro"><div class="tag">FROM YOUR CHATS TO YOUR PRACTICE</div><h1>Your course library.</h1><p>Quick Courses for focused study. Deep Dives for deeper understanding. All connected to your roadmaps.</p></div>
  <div class="course-library-banner"><div><h2>50 conversations. One place to continue.</h2><p>The bundled texts are excerpts from your chats, not complete courses. Import <b>conversations.json</b> from a ChatGPT data export to replace matching excerpts with complete replies. Imports stay in this browser.</p></div><label class="button import-course">{{importing() ? 'Importing…' : 'Import full chat export'}}<input type="file" accept=".json,application/json" [disabled]="importing()" (change)="importFile($event)"></label></div>
  @if (message()) { <p role="status" class="evidence">{{message()}}</p> }
  <div class="course-tools"><input pInputText aria-label="Search courses" placeholder="Search course topics…" [ngModel]="search()" (ngModelChange)="search.set($event)"><p-selectbutton [options]="tracks" optionLabel="label" optionValue="value" [allowEmpty]="false" [ngModel]="track()" (ngModelChange)="track.set($event)" ariaLabel="Course format" /></div>
  @if (roadmapName(); as name) { <p class="muted">Courses connected to {{name}} · <a routerLink="/courses">Show all courses</a></p> }
  <div class="course-library-stats"><span>{{filtered().length}} {{filtered().length===1?'course':'courses'}}</span><span>{{p.courseEntries().filter(completed).length}} sections complete</span><span>{{library.importedIds().length}} text replacements imported</span></div>
  @if (p.courseResume(); as resume) { <div class="panel course-resume"><div><span class="tag">RESUME YOUR READING</span><h3>{{resume.course?.title}}</h3></div><a class="button" [routerLink]="['/courses',resume.courseId]" [queryParams]="{section:resume.chapterId}">Continue →</a></div> }
  <div class="grid">@for (c of filtered(); track c.id) {
    <a class="card course-card" [routerLink]="['/courses',c.id]"><div class="section-head"><span class="pill">{{c.track==='quick'?'Quick Course':'Deep Dive'}}</span><span class="source-status">{{library.importedIds().includes(c.id)?'Imported text':'Source excerpt'}}</span></div><h3>{{c.title}}</h3><p>{{c.category==='technical'?'Technical depth & architecture':'Leadership & organizational practice'}}</p><span class="muted">{{completedFor(c.id)}} sections complete · Read course ↗</span></a>
  } @empty { <div class="panel empty">No courses match. Try another topic or format.</div> }</div>
` })
export class CoursesComponent {
  readonly library=inject(CourseLibraryService); readonly p=inject(ProgressService);
  private readonly query=toSignal(inject(ActivatedRoute).queryParamMap);
  readonly search=signal(''); readonly track=signal('all'); readonly message=signal(''); readonly importing=signal(false);
  readonly tracks=[{label:'All courses',value:'all'},{label:'Quick Course',value:'quick'},{label:'Deep Dive',value:'deep'}];
  readonly completed=(e: {record:{done?:boolean}})=>!!e.record.done;
  readonly roadmapName=computed(()=>topics.find(t=>t.id===this.query()?.get('roadmap'))?.name);
  readonly filtered=computed(()=>courseCatalog.filter(c=>(this.track()==='all'||c.track===this.track())&&(c.title.toLowerCase().includes(this.search().toLowerCase()))&&(!this.roadmapName()||c.roadmapIds.includes(this.query()!.get('roadmap')!))));
  constructor(){void this.library.refreshImports();}
  completedFor(id:string){return this.p.courseEntries().filter(e=>e.course.id===id&&e.record.done).length;}
  async importFile(event:Event){
    const input=event.target as HTMLInputElement;
    try {const file=input.files?.[0];if(!file)return;if(file.size>100_000_000)throw new Error('Please use a JSON export smaller than 100 MB.');this.importing.set(true);
      const count=await this.library.importExport(await file.text());this.message.set(count+' course texts imported. Existing progress and notes were kept.');
    }catch(error){this.message.set(error instanceof Error?error.message:'Import could not be saved.');}finally{this.importing.set(false);input.value='';}
  }
}
