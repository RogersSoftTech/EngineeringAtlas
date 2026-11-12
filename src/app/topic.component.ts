import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { topics } from './curriculum';
import { ProgressService } from './progress.service';

@Component({ selector: 'atlas-topic', imports: [RouterLink], template: `
  <a class="back" routerLink="/roadmaps">← All roadmaps</a>
  @if (topic(); as t) {
    <div class="intro"><div class="tag">{{t.category}} ROADMAP</div><h1>{{t.name}}</h1><p>{{t.description}}</p></div>
    <div class="panel"><div class="section-head"><h2>{{p.mode() === 'learning' ? 'Understand. Apply. Reflect.' : 'Explain. Practice. Refine.'}}</h2><span>{{p.topicPercent(t.id)}}% complete</span></div><div class="bar"><i [style.width.%]="p.topicPercent(t.id)"></i></div>
      @for (m of t.modules; track m.id; let i = $index) { <div class="list-row"><div><span class="tag">MODULE 0{{i+1}} · {{m.minutes}} MIN</span><h3>{{m.title}}</h3><span class="muted">{{p.record(m.id).done ? '✓ Complete' : p.record(m.id).started ? 'In progress' : 'Not started'}}</span></div><a class="button" [routerLink]="['/module',m.id]">{{p.record(m.id).started ? 'Continue' : 'Start'}} →</a></div> }
    </div>
  } @else { <h1>Roadmap not found</h1><p>Choose a roadmap from the library.</p> }
` })
export class TopicComponent {
  readonly p = inject(ProgressService); private readonly params = toSignal(inject(ActivatedRoute).paramMap);
  topic() { return topics.find(t => t.id === this.params()?.get('id')); }
}
