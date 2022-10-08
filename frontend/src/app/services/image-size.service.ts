import { Injectable } from '@angular/core';
import {imageSizeKeys, originalImageKey} from '../types/image.type';

@Injectable({
  providedIn: 'root'
})
export class ImageSizeService {

  constructor() { }

  public calculateSrcSetString(imageSizes: {[p: string]: string}): string {
    if (imageSizes['originalImageKey']) { // ToDo: change this back one we can get the image sizes from the backend so we do not have to use pinata for this
      return imageSizes['originalImageKey'];
    }
    // return imageSizeKeys.map(size => imageSizes[size] + ' ' + size).join(', ').concat(', ' + this.getOriginalString(imageSizes) + ' 1600w'); maybe add original image?
    return imageSizeKeys.map(size => imageSizes[size] + ' ' + size).join(', ');
  }

  public getOriginalString(imageSizes: {[p: string]: string}): string {
    return imageSizes[originalImageKey];
  }

  public get1000WImage(imageSizes: {[p: string]: string}): string {
    if (imageSizes['originalImageKey']) { // ToDo: change this back one we can get the image sizes from the backend so we do not have to use pinata for this
      return imageSizes['originalImageKey'];
    }
    return imageSizes['1000w'];
  }
}
