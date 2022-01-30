import { TestBed } from '@angular/core/testing';

import { ImageSizeService } from './image-size.service';

describe('ImageSizeService', () => {
  let service: ImageSizeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImageSizeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
