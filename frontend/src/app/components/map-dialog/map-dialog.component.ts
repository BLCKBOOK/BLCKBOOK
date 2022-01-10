import {Component, Inject} from '@angular/core';
import {icon, LatLng, latLng, Layer, LeafletMouseEvent, marker, tileLayer} from 'leaflet';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';

export interface MapDialogData {
  latlng: LatLng;
}

@Component({
  selector: 'app-map-dialog',
  templateUrl: './map-dialog.component.html',
  styleUrls: ['./map-dialog.component.scss']
})
export class MapDialogComponent {

  options: any;

  markers: Layer[] = [];
  currentLocation: LatLng;

  constructor(@Inject(MAT_DIALOG_DATA) public data: MapDialogData) {
    if (data?.latlng) {
      this.options = {
        layers: [
          tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 20, attribution: 'Open Street Map'})
        ],
        zoom: 12,
        center: this.data.latlng
      };
      this.addMarker(data.latlng);
    } else {
      this.options = {
        layers: [
          tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 20, attribution: 'Open Street Map'})
        ],
        zoom: 12,
        center: latLng(52.49159913183949, 13.392532863660682)
      };
    }
  }

  mapClick($event: LeafletMouseEvent) {
    if (this.data?.latlng) {
      return;
    }
    this.markers.pop();
    this.addMarker($event.latlng);
    this.currentLocation = $event.latlng;
  }

  addMarker(latlng: LatLng) {
    const newMarker = marker(
      latlng,
      {
        icon: icon({
          iconSize: [25, 41],
          iconAnchor: [13, 41],
          shadowUrl: './assets/marker-shadow.png',
          iconUrl: './assets/marker-icon.png',
        })
      }
    );
    this.markers.push(newMarker);
  }

  removeMarker() {
    this.markers.pop();
  }
}
