import { Component, computed, effect, inject, untracked } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { cloud } from './curriculum';
import { ProgressService, modules } from './progress.service';
import { Progress } from './models';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';

@Component({ selector: 'atlas-module', imports: [RouterLink, FormsModule, ButtonModule, TextareaModule, SelectModule], templateUrl: './module.component.html' })
export class ModuleComponent {
  readonly p = inject(ProgressService);
  private readonly router = inject(Router);
  private readonly params = toSignal(inject(ActivatedRoute).paramMap);
  readonly module = computed(() => modules.find(m => m.id === this.params()?.get('id')));
  readonly record = computed(() => this.module() ? this.p.record(this.module()!.id) : {});
  readonly cloud = cloud;
  readonly confidenceOptions = [
    {label:'Not assessed yet',value:0}, {label:'1 · Need guidance',value:1}, {label:'2 · Developing',value:2},
    {label:'3 · Can apply with support',value:3}, {label:'4 · Can apply independently',value:4}, {label:'5 · Can teach others',value:5}
  ];
  constructor() {
    effect(() => { const m = this.module(); this.p.mode(); if (m) untracked(() => this.p.visit(m.id)); });
  }
  edit(field: 'work' | 'notes' | 'takeaway' | 'confidence', value: string | number) {
    const m = this.module(); if (m) this.p.update(m.id, { [field]: value } as Partial<Progress>);
  }
  next() {
    const m = this.module(); if (!m) return;
    const index = m.topic.modules.findIndex(x => x.id === m.id);
    this.router.navigate(index < m.topic.modules.length - 1 ? ['/module', m.topic.modules[index + 1].id] : ['/topic', m.topic.id]);
  }
}
