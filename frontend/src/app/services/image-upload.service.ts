import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from "rxjs";
import awsconfig from '../../aws-exports';

@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {

  private readonly imageUploadURL = awsconfig.aws_appsync_graphqlEndpoint;  // ToDo: fix this!

  constructor(private httpClient: HttpClient) {
  }

  uploadImage(userId: string, image: File): Observable<any> { // how to authenticate?
    const formData = new FormData();
    formData.append('image', image);
    return this.httpClient.post(this.imageUploadURL + '/picture', formData);
  }

  isImageUploadValid(userId: string): Observable<boolean> { // how to authenticate?
    const formData = new FormData();
    formData.append('userId', userId);
    return this.httpClient.get<boolean>(this.imageUploadURL + '/allowed', {responseType: 'json'});
  }
}
