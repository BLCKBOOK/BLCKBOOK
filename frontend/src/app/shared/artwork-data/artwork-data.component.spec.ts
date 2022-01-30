import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArtworkDataComponent } from './artwork-data.component';

describe('ArtworkDataComponent', () => {
  let component: ArtworkDataComponent;
  let fixture: ComponentFixture<ArtworkDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ArtworkDataComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ArtworkDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
