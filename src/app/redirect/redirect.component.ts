import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Observable, catchError, mergeMap, throwError } from 'rxjs';
import { SpotifyService } from '../spotify.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ISpotifyCredentials } from 'src/models/token.interface';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-redirect',
  standalone: true,
  templateUrl: './redirect.component.html',
  styleUrls: ['./redirect.component.scss'],
})
export class RedirectComponent implements OnInit {
  isRedirectWorks = false;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private spotifyService: SpotifyService,
    private cookieService: CookieService
  ) {}

  ngOnInit(): void {
    const $auth_code: Observable<any> = this.route.queryParams.pipe(
      mergeMap((params) =>
        this.spotifyService.requestAccessToken(params).pipe(
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
        )
      )
    );

    $auth_code.subscribe({
      next: (prof: ISpotifyCredentials) => {
        console.log(prof);
        this.cookieService.set('access_token', prof.access_token);
        this.cookieService.set('refresh_token', prof.refresh_token);
        this.cookieService.set('token_type', 'Bearer');
        this.cookieService.set('scope', prof.scope);
        this.router.navigate(['/me/contributions']);

      },
      error: (err) => {
        console.log(err);
      },
    });
  }
}
