import { Component, computed, signal } from '@angular/core';
import { topics } from './curriculum';
import { TopicCardComponent } from './topic-card.component';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

@Component({ selector: 'atlas-roadmaps', imports: [TopicCardComponent, FormsModule, InputTextModule, SelectModule], template: `
  <div class="intro"><div class="tag">EXPLORE & DEVELOP</div><h1>A roadmap for every dimension.</h1><p>Reusable paths from understanding to practice. Choose a topic and make it yours.</p></div>
  <div class="toolbar"><input pInputText aria-label="Search roadmaps" placeholder="Search topics or modules…" [value]="search()" (input)="search.set($any($event.target).value)"><p-select ariaLabel="Filter category" [options]="categories" optionLabel="label" optionValue="value" [ngModel]="category()" (ngModelChange)="category.set($event)" appendTo="body" /></div>
  <div class="grid">@for(t of filtered(); track t.id) { <atlas-topic-card [topic]="t" /> } @empty { <p class="empty">No matching roadmaps. Try another search.</p> }</div>
` })
export class RoadmapsComponent {
  readonly search = signal(''); readonly category = signal('all');
  readonly categories = [{label:'All disciplines',value:'all'}, {label:'Technical craft',value:'technical'}, {label:'Leadership practice',value:'leadership'}];
  readonly filtered = computed(() => topics.filter(t => (this.category() === 'all' || t.category === this.category()) && (t.name + ' ' + t.modules.map(m => m.title).join(' ')).toLowerCase().includes(this.search().toLowerCase())));
}
