import { Injectable } from '@angular/core';
import {environment} from "../../environments/environment";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {

  private readonly imageUploadURL;  // URL to web api

  constructor(private httpClient: HttpClient) {
    this.imageUploadURL = environment.apiURL + '/personal/users';
  }

  uploadImage(userId: String, image: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', image);
    return this.httpClient.post(this.imageUploadURL + '/picture', formData);
  }
}
