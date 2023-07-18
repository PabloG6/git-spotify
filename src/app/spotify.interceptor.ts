import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable()
export class SpotifyInterceptor implements HttpInterceptor {

  // baseUrl: string = "http://api.saveyourdailymixes.com";
  baseUrl: string = "http://localhost:3000";
  constructor() {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log(request.url);
    if(request.url.indexOf('/api/') != -1) {
      console.log('hello world');
      const url = request.url.replace('/api', '');
      console.log(url);
      request = request.clone({url: `${environment.apiUrl}${url}`, withCredentials: true})
      console.log('request url', request.url);
      console.log('full request', request);
      return next.handle(request);
    }
   

    return next.handle(request);
  }
}