import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RedirectComponent } from './redirect/redirect.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { SpotifyInterceptor } from './spotify.interceptor';
import { CalendarComponent } from './calendar/calendar.component';
import { SquareComponent } from './square/square.component';

@NgModule({
  declarations: [
    AppComponent,


   
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: SpotifyInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
