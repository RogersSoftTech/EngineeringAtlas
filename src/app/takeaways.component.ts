import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProgressService } from './progress.service';

@Component({ selector: 'atlas-takeaways', imports: [RouterLink], template: `
  <div class="intro"><div class="tag">YOUR PERSONAL KNOWLEDGE BASE</div><h1>Keep what matters.</h1><p>Your takeaways from {{p.mode() === 'learning' ? 'learning' : 'interview practice'}}, ready to revisit.</p></div>
  <div class="grid">@for (m of p.takeaways(); track m.id) { <a class="card" [routerLink]="['/module',m.id]"><span class="tag">{{m.topic.name}}</span><h3>{{m.title}}</h3><p class="preserve-lines">{{p.record(m.id).takeaway}}</p><span class="muted">Revisit module ↗</span></a> } @empty { <div class="panel empty">No takeaways yet. Capture one in any module to see it here.</div> }</div>
` })
export class TakeawaysComponent { readonly p = inject(ProgressService); }
