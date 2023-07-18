import { Component, OnInit } from '@angular/core';
import { SpotifyService } from '../spotify.service';
import { Observable, first, map } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SpotifyRequest } from 'src/models/request.interface';
import { SpotifyTracks } from 'src/models/tracks.interface';
import { SquareComponent } from '../square/square.component';
type TrackUnion = TrackCounter | null | 'none';
export type TrackCounter = { count: number; track: SpotifyTracks };

@Component({
  selector: 'app-calendar',
  standalone: true,

  imports: [CommonModule, SquareComponent],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
})
export class CalendarComponent implements OnInit {
  $songs: Observable<any>;
  selectedYear: Date = this.getCurrentDate();
  years: Date[] = [];
  daysOfYear: [Date, SpotifyTracks | 'loading' | 'none'][] = [];
  newDays: TrackUnion[] = [];

  constructor(private spotifyService: SpotifyService) {
    //get the start of the day in javascript

    let year = this.getCurrentDate();
    this.years.push(year);
    while (year.getFullYear() > 2015) {
      year = new Date(year.getFullYear() - 1, 11, 31);
      this.years.push(year);
    }

    this.$songs = this.spotifyService
      .getLikedSongs()
      .pipe(map((track) => track))
      .pipe(
        map((resp) => {
          return resp.items.reverse();
        })
      )
      .pipe(map(this._organizeTracks.bind(this)));

    this.$songs.subscribe({
      next: this._fillTracks.bind(this),
      error: (err) => {
        console.log('err', err);
      },
    });
  }
  ngOnInit(): void {
    const firstDayOfYear = new Date(new Date().getFullYear(), 0, 1);

    const currentDay = new Date();
    for (
      var d = firstDayOfYear;
      firstDayOfYear < currentDay;
      d.setDate(firstDayOfYear.getDate() + 1)
    ) {
      this.daysOfYear.push([d, 'loading']);
    }
  }

  isLeapYear(year: number) {
    return year % 100 === 0 ? year % 400 === 0 : year % 4 === 0;
  }

  getCurrentDaysForYear(date: Date) {
    if(this.isLeapYear(date.getFullYear())) {
      return 366;
    } 

    return 365;
  }

  getCurrentDate() {
    return new Date();
  }


  chooseYear(endYear: Date) {
    this.selectedYear = endYear;

    const startYear = new Date(endYear.getFullYear(), 0, 1);
    console.log(endYear, startYear);
    this.spotifyService
      .getLikedSongs(
        50,
        this.spotifyService.lastKnownOffset,
        startYear,
        endYear
      )
      .pipe(
        map((resp) => {
          return resp.items.reverse();
        }),
        map(this._organizeTracks.bind(this))
      ).subscribe(({next: this._fillTracks.bind(this), error: (err) => {
        console.log(err);
      }}))
  }

  _organizeTracks(tracks: SpotifyTracks[]) {
    const newTracksMap = new Map();


    const firstDay = new Date(this.selectedYear.getFullYear(), 0, 1);
  
    tracks.map((track, index) => {


      const currentTrackDate = new Date(
        new Date(track.added_at).toDateString()
      );
      if (firstDay < currentTrackDate) {
        //check if the first track is in the first day of the year.
       
        let trackKey = new Date(
          currentTrackDate.setDate(currentTrackDate.getDate())
        ).getTime();

        if (newTracksMap.has(trackKey)) {
          const track: { track: SpotifyTracks; count: number } =
            newTracksMap.get(trackKey);
          newTracksMap.set(trackKey, {
            track: track.track,
            count: track.count + 1,
          });
        } else {
          newTracksMap.set(trackKey, { track: track, count: 0 });
        }
        if (index + 1 < tracks.length) {
          const nextTrack = tracks[index + 1];
          const nextTrackDate = new Date(
            new Date(nextTrack.added_at).toDateString()
          );

          var differenceInDays =
            this.spotifyService.getDifferenceBetweenDatesInDays(
              nextTrackDate,
              currentTrackDate
            );
          if (differenceInDays > 1) {
            for (let i = 0; i < differenceInDays - 1; i++) {
              const trackKey = new Date(
                currentTrackDate.setDate(currentTrackDate.getDate() + 1)
              );
              newTracksMap.set(trackKey.getTime(), null);
            }
          } else {
          }
        }
      }
    });

    console.log(tracks);

    return [[...newTracksMap.keys()].sort(), newTracksMap];
  }

  _fillTracks(resp: any) {
    console.log('fill tracks called', this.selectedYear);
      this.newDays = []
      console.log(resp);
      const keys = resp[0];
      const values = resp[1];
      const firstTrackId = keys[0]
      const firstTrack = values.get(firstTrackId);

      console.log('firstTrack: ', firstTrack, 'firstTrackId: ', firstTrackId);
      if (firstTrack && (firstTrack as TrackCounter).track) {

        const firstDate = this.spotifyService.convertToDate(firstTrack.track.added_at);

       const difference = this.spotifyService.getDifferenceBetweenDatesInDays(firstDate, new Date(this.selectedYear.getFullYear(), 0, 0))
       console.log('difference:', difference);
       for(let i = 0; i < difference; i++) {
         this.newDays.push(null)
       }


        
      
      }

     
      for (let i = 0; i < keys.length; i++) {
        const val = values.get(keys[i]);
        this.newDays.push(val);
      }



      let endTrackCounter: any = this.newDays[this.newDays.length - 1];
      console.log(endTrackCounter);
      if (endTrackCounter && (endTrackCounter as TrackCounter).track) {
        const lastDate = endTrackCounter as TrackCounter;
        console.log('inside track counter');

        
       
        console.log(this.newDays.length)
        if (this.newDays.length < this.getCurrentDaysForYear(this.selectedYear)) {
         
          while(this.newDays.length != this.getCurrentDaysForYear(this.selectedYear)) {
            this.newDays.push("none");
          }

          console.log(this.newDays.length, this.newDays);
        }
      }
    }
  
}
