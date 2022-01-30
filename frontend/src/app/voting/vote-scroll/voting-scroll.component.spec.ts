import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VotingScrollComponent } from './voting-scroll.component';

describe('ScrollComponent', () => {
  let component: VotingScrollComponent;
  let fixture: ComponentFixture<VotingScrollComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VotingScrollComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VotingScrollComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
