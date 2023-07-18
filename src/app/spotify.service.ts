import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';

import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { ISpotifyCredentials } from 'src/models/token.interface';
import { Params, Router } from '@angular/router';
import { Observable, catchError, debounce, expand, interval, reduce, skipWhile, takeWhile, throwError } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { SpotifyTracks } from 'src/models/tracks.interface';
import { SpotifyRequest } from 'src/models/request.interface';
@Injectable({
  providedIn: 'root',
})
export class SpotifyService {
  readonly clientid: string = 'bf0358342e4446de8231f662c92e86db';
  readonly clientSecret: string = '826b4dcfcdec4288bd50f3177a396f05';
  readonly accountsUrl: string = `https://accounts.spotify.com/authorize?`;
  lastKnownOffset = 0;
  constructor(
    @Inject(DOCUMENT) private document: Document,
    private httpClient: HttpClient,
    private router: Router,
    private cookieService: CookieService
  ) {}

  generateCodeVerifier(length: number) {
    let text = '';
    let possible =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  async generateCodeChallenge(codeVerifier: string) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  async redirectToAuthCodeFlow(clientId: string) {
    const verifier = this.generateCodeVerifier(128);
    const challenge = await this.generateCodeChallenge(verifier);
    localStorage.setItem('verifier', verifier);

    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('response_type', 'code');
    params.append('redirect_uri', 'http://localhost:4200/redirect_uri');
    params.append(
      'scope',
      'user-read-private user-read-email user-library-read'
    );
    params.append('code_challenge_method', 'S256');
    params.append('code_challenge', challenge);

    this.document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  requestAccessToken(params: Params) {
    return this.httpClient
      .get<ISpotifyCredentials>('/api/get_token', {
        params: {
          grant_type: 'authorization_code',
          code: params['code'],
          code_verifier: localStorage.getItem('verifier')!,
          redirect_uri: environment.redirect_uri,
        },
      })
      .pipe(
        catchError((err) => {
          if (err instanceof HttpErrorResponse) {
            const response = err.error as {
              error: string;
              error_description: string;
            };
            if (response && response.error_description) {
              this.router.navigate(['/']);
            }
          }
          return throwError(() => new Error(err));
        })
      );
  }

  get credentials() {
    const _credentials: ISpotifyCredentials = {
      access_token: this.cookieService.get('access_token'),
      expires_in: parseInt(this.cookieService.get('expires_in')),
      refresh_token: this.cookieService.get('refresh_token'),
      scope: this.cookieService.get('scope'),
      token_type: 'Bearer',
    };
    return _credentials;
  }

  //get all the songs for the year
  getLikedSongs(limit: number = 50, offset: number = 0, startDate = new Date(new Date().getFullYear(), 0, 1), endDate = new Date()): Observable<SpotifyRequest<SpotifyTracks>> {
    return this.httpClient
      .get<SpotifyRequest<SpotifyTracks>>(
        'https://api.spotify.com/v1/me/tracks',
        {
          headers: new HttpHeaders({
            Authorization: `Bearer ${this.credentials.access_token}`,
          }),
          params: {
            limit: 50,
            offset: 0,
            market: 'ES',
          },
        }
      )
      .pipe(
        expand((result) => this.getLikedSongsByNext(result.next)),
        skipWhile((val) => {
          const dateValue = val.items.at(0)?.added_at;
          if(dateValue) {
            const actualDate = this.convertToDate(dateValue);
            if(actualDate > endDate) {
              console.log('skipping: ', actualDate, endDate)
              return true;
            }

          }

          return false;
        }),
        takeWhile((value) => {
    
          const dateValue = value.items.at(0)?.added_at;
          console.log(dateValue);

          if (dateValue) {
            const date = new Date(dateValue);
            console.log('take while: ', date);
            return date > startDate;
          } else {
            return false;
          }
        }), 
        reduce((acc, val) => {
          
       
          acc.items = acc.items.concat(val.items);
          acc.next = val.next;
          
          return acc;
        }),
        catchError((err) => {
          if (err instanceof HttpErrorResponse) {
            if (err.status === 401) {
              this.router.navigate(['/']);
            }
            const response = err.error as {
              error: string;
              error_description: string;
            };
            if (response && response.error_description) {
              this.router.navigate(['/']);
            }
          }
          return throwError(() => new Error(err));
        }),
       
      );
  }

  getLikedSongsByNext(url: string) {
    return this.httpClient.get<SpotifyRequest<SpotifyTracks>>(url, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${this.credentials.access_token}`,
      }),
    });
  }
  getLikedSongsMetaData(limit: number = 50, offset: number = 0): Observable<SpotifyRequest<SpotifyTracks>> {
    return this.httpClient
    .get<SpotifyRequest<SpotifyTracks>>(
      'https://api.spotify.com/v1/me/tracks',
      {
        headers: new HttpHeaders({
          Authorization: `Bearer ${this.credentials.access_token}`,
        }),
        params: {
          limit: limit,
          offset: offset,
          market: 'ES',
        },
      }
    )
  }

  getDifferenceBetweenDatesInDays(date1: Date , date2: Date): number {
    const difference = date1.getTime() - date2.getTime();
    return  difference / (1000 * 3600 * 24) 
  }

  convertToDate(date: string) {
    return new Date(new Date(date).toDateString());
  }
}


