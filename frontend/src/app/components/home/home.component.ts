import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  username: string;

  constructor() {
    this.username = '';
  }

  ngOnInit(): void {
    this.username = 'Slashermcgurk';
    if (navigator && navigator.geolocation) {
      console.log('location');
      navigator.geolocation.getCurrentPosition(this.successCallback, this.errorCallback);
    } else {
      window.alert('no location');
      console.log('no location');
    }
  }

  private successCallback: PositionCallback = position => {
    console.log(position.coords.latitude);
    console.log(position.coords.longitude);
    console.log(position.coords.accuracy);
    window.alert(position.coords.accuracy);
  }

  private errorCallback: PositionErrorCallback = positionError => {
    window.alert(positionError.message);
  }

}
