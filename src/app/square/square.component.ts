import { Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-square',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  host: {
   
 
  },
  templateUrl: './square.component.html',
  styleUrls: ['./square.component.scss']
})
export class SquareComponent {

  @Input('name') name?: string;
  @Input('date') date!: Date;
  @Input('level') status: 'loading' | 'none' | 'low' | 'medium' | 'high' = 'loading';




}
