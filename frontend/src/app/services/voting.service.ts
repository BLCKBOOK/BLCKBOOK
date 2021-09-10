import { Injectable } from '@angular/core';
import {UploadedArtwork} from '../../../../backend/src/common/tableDefinitions'
import {Observable, of} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VotingService {

  public selectedArtworks: UploadedArtwork[] = [];
  private votesLeft: number;

  constructor() {
    this.votesLeft = 0;
  }

  public getMaxVoteAmount(): Observable<number> {
    return of(5);
  }

  public getVotesSpent(): Observable<number> {
    return of(3);
  }

/*
  loadArtworks()
*/


}
