import {Component, Inject} from '@angular/core';
import {icon, LatLng, latLng, Layer, LeafletMouseEvent, Map, MapOptions, marker, tileLayer} from 'leaflet';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {GeoSearchControl, OpenStreetMapProvider} from 'leaflet-geosearch';

export interface MapDialogData {
  latlng: LatLng;
  changeable?: boolean; // default is false
}

@Component({
  selector: 'app-map-dialog',
  templateUrl: './map-dialog.component.html',
  styleUrls: ['./map-dialog.component.scss']
})
export class MapDialogComponent {
  options: MapOptions;
  markers: Layer[] = [];
  currentLocation: LatLng;
  provider: OpenStreetMapProvider;
  searchControl: any;
  map: Map;

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

    this.provider = new OpenStreetMapProvider();
    this.searchControl = GeoSearchControl({
      provider: this.provider,
      showMarker: false
    });
  }

  mapClick($event: LeafletMouseEvent) {
    if (this.data?.latlng && !this.data?.changeable) {
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

  onMapReady(map: Map) {
    this.map = map;
    map.addControl(this.searchControl);
  }
}
