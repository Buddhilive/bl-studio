import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DashboardComponent } from './dashboard/dashboard.component';
import { TriosComponent } from './trios/trios.component';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatRippleModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GlobalVariables } from './shared/global.variables';
import { TriosProComponent } from './trios-pro/trios-pro.component';
import { DrumGrooveComponent } from './drum-groove/drum-groove.component';
import { TonebreakerComponent } from './tonebreaker/tonebreaker.component';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    TriosComponent,
    TriosProComponent,
    DrumGrooveComponent,
    TonebreakerComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    MatInputModule,
    MatSliderModule,
    MatButtonToggleModule,
    MatSelectModule,
    MatCardModule,
    MatTooltipModule,
    MatSidenavModule,
    MatListModule,
    MatRippleModule,
    MatProgressSpinnerModule
  ],
  providers: [GlobalVariables],
  bootstrap: [AppComponent]
})
export class AppModule { }
