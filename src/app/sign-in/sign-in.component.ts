import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpotifyService } from '../spotify.service';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss']
})
export class SignInComponent {

  constructor(private spotifyService: SpotifyService) {

  }
  async signIn() {
    this.spotifyService.redirectToAuthCodeFlow(this.spotifyService.clientid);
  }
}
