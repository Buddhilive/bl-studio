import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { TriosComponent } from './trios/trios.component';
import { DrumGrooveComponent } from './drum-groove/drum-groove.component';
import { TonebreakerComponent } from './tonebreaker/tonebreaker.component';


const routes: Routes = [
  {
    path: '',
    component: DashboardComponent
  },
  {
    path: 'melody',
    component: TriosComponent
  },
  {
    path: 'drumbeats',
    component: DrumGrooveComponent
  },
  {
    path: 'tonebreaker',
    component: TonebreakerComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
