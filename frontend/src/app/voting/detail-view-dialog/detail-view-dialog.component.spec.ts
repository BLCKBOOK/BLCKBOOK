import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailViewDialogComponent } from './detail-view-dialog.component';

describe('DetailViewDialogComponent', () => {
  let component: DetailViewDialogComponent;
  let fixture: ComponentFixture<DetailViewDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetailViewDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailViewDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
