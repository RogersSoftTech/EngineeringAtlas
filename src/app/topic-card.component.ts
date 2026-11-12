import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Topic } from './models';
import { ProgressService } from './progress.service';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({ selector: 'atlas-topic-card', imports: [RouterLink, ProgressBarModule], template: `
  <a class="card" [routerLink]="['/topic', topic().id]">
    <div class="icon">{{topic().icon}}</div>
    <div class="tag" style="margin-top:18px">{{topic().category === 'technical' ? 'Technical craft' : 'Leadership practice'}}</div>
    <h3>{{topic().name}}</h3><p>{{topic().description}}</p>
    <p-progressbar [value]="p.topicPercent(topic().id)" [showValue]="false" [attr.aria-label]="topic().name + ' completion'" />
    <div class="card-bottom"><span>{{completeCount()}} / {{topic().modules.length}} modules</span><span>{{p.topicPercent(topic().id)}}% complete ↗</span></div>
  </a>` })
export class TopicCardComponent {
  readonly topic = input.required<Topic>(); readonly p = inject(ProgressService);
  completeCount() { return this.topic().modules.filter(m => this.p.record(m.id).done).length; }
}
