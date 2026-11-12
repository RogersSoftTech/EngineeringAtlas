import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProgressService } from './progress.service';

@Component({ selector: 'atlas-takeaways', imports: [RouterLink], template: `
  <div class="intro"><div class="tag">YOUR PERSONAL KNOWLEDGE BASE</div><h1>Keep what matters.</h1><p>Your takeaways from {{p.mode() === 'learning' ? 'learning' : 'interview practice'}}, ready to revisit.</p></div>
  <div class="grid">@for (m of p.takeaways(); track m.id) { <a class="card" [routerLink]="['/module',m.id]"><span class="tag">{{m.topic.name}}</span><h3>{{m.title}}</h3><p class="preserve-lines">{{p.record(m.id).takeaway}}</p><span class="muted">Revisit module ↗</span></a> } @empty { <div class="panel empty">No takeaways yet. Capture one in any module to see it here.</div> }</div>
  @if(p.mode()==='learning') { <div class="section-head"><h2>From your course library</h2></div><div class="grid">@for(e of courseTakeaways();track e.course.id+'/'+e.chapterId){<a class="card" [routerLink]="['/courses',e.course.id]" [queryParams]="{section:e.chapterId}"><span class="tag">{{e.course.track==='quick'?'Quick Course':'Deep Dive'}}</span><h3>{{e.course.topic}}</h3><p class="preserve-lines">{{e.record.takeaway}}</p><span class="muted">Return to section ↗</span></a>}@empty{<p class="muted">Course takeaways will appear here when you add them.</p>}</div> }
` })
export class TakeawaysComponent { readonly p = inject(ProgressService); courseTakeaways(){return this.p.courseEntries().filter(e=>e.record.takeaway?.trim());} }
