import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { RoadmapsComponent } from './roadmaps.component';
import { TopicComponent } from './topic.component';
import { ModuleComponent } from './module.component';
import { TakeawaysComponent } from './takeaways.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'roadmaps', component: RoadmapsComponent },
  { path: 'topic/:id', component: TopicComponent },
  { path: 'module/:id', component: ModuleComponent },
  { path: 'takeaways', component: TakeawaysComponent },
  { path: '**', redirectTo: 'dashboard' }
];
