import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProgressService, modules } from './progress.service';
import { topics } from './curriculum';
import { TopicCardComponent } from './topic-card.component';

@Component({ selector: 'atlas-dashboard', imports: [RouterLink, TopicCardComponent], template: `
  <div class="intro"><div class="tag">YOUR GROWTH, BY DESIGN</div><h1>Make room for your next chapter.</h1><p>A focused workspace for technical depth, thoughtful leadership, and steady progress.</p></div>
  <div class="stats">
    <div class="stat"><small>OVERALL PROGRESS</small><strong>{{percent()}}%</strong><small>{{p.completed().length}} of {{total}} modules complete</small></div>
    <div class="stat"><small>YOUR ROADMAPS</small><strong>13</strong><small>6 technical · 7 leadership</small></div>
    <div class="stat"><small>IN PROGRESS</small><strong>{{p.started().length}}</strong><small>Pick up where you left off</small></div>
    <div class="stat"><small>TAKEAWAYS CAPTURED</small><strong>{{p.takeaways().length}}</strong><small>Knowledge you can return to</small></div>
  </div>
  <section class="panel course-resume"><div><span class="tag">YOUR CONVERSATIONS, CONNECTED</span><h2>Quick Courses & Deep Dives</h2><p class="muted">50 source chats across 29 topics. Read, reflect, and continue from your last section.</p>@if(p.courseResume();as r){<p>Continue: <a [routerLink]="['/courses',r.courseId]" [queryParams]="{section:r.chapterId}">{{r.course?.title}}</a></p>}</div><a class="button" routerLink="/courses">Open course library →</a></section>
  <div class="hero"><div>
    @if (p.resume(); as m) { <div class="tag">YOUR NEXT STEP</div><h2>{{m.title}}</h2><p>{{m.topic.name}} · {{m.minutes}} min · {{p.record(m.id).started ? 'Continue your unfinished module.' : 'Start with a practical, focused module.'}}</p><a class="button" [routerLink]="['/module', m.id]">Open module →</a> }
    @else { <div class="tag">ALL ROADMAPS COMPLETE</div><h2>Keep the learning alive.</h2><p>Revisit your notes, practice your explanations, and reassess confidence.</p><a class="button" routerLink="/roadmaps">Explore roadmaps →</a> }
  </div><div class="hero-mark">◈</div></div>
  <div class="section-head"><h2>Your learning roadmaps</h2><a routerLink="/roadmaps" class="muted">View all 13 ↗</a></div>
  <div class="grid">@for (t of topics.slice(0,3); track t.id) { <atlas-topic-card [topic]="t" /> }</div>
  <div class="two"><section class="panel"><div class="tag">A LITTLE DIRECTION</div><h2>What to study next</h2>
    @for (m of p.recommendations().slice(0,3); track m.id; let i = $index) {
      <div class="list-row"><div><small class="muted">0{{i+1}} / {{m.topic.name}}</small><h3>{{m.title}}</h3><small class="muted">{{p.record(m.id).started ? 'Finish what you started' : (p.record(m.id).confidence ?? 0) > 0 && (p.record(m.id).confidence ?? 0) <= 2 ? 'Build confidence through practice' : 'Next unfinished foundation'}}</small></div><a class="button" [routerLink]="['/module',m.id]">Study ↗</a></div>
    } @empty { <p>All complete. Revisit a roadmap to deepen your practice.</p> }
  </section><section class="panel"><div class="tag">SELF-ASSESSED SKILLS</div><h2>Strengths & growth areas</h2><p class="muted">Confidence is self-reported, separate from completion.</p>
    <div class="list-row"><span>Strengths · confidence 4–5</span><span class="pill">{{p.strengths().length}} modules</span></div>
    @for (m of p.strengths().slice(0,3); track m.id) { <p><a [routerLink]="['/module',m.id]">↗ {{m.title}}</a></p> }
    <div class="list-row"><span>Gaps · confidence 1–2</span><span class="pill">{{p.gaps().length}} modules</span></div>
    @for (m of p.gaps().slice(0,3); track m.id) { <p><a [routerLink]="['/module',m.id]">◎ {{m.title}}</a></p> }
    <p class="muted">{{p.assessed().length}} of {{total}} modules assessed. Unrated modules remain unknown.</p>
  </section></div>
` })
export class DashboardComponent {
  readonly p = inject(ProgressService); readonly topics = topics; readonly total = modules.length;
  percent() { return Math.round(this.p.completed().length / this.total * 100); }
}
