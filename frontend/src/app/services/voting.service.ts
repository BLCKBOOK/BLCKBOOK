import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {MasonryItem} from '../components/scroll/scroll.component';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class VotingService {

  private votesLeft: number;
  private votedArtworks: BehaviorSubject<MasonryItem[]> = new BehaviorSubject<MasonryItem[]>([]);

  constructor() {
    this.votesLeft = 0;
  }

  public getMaxVoteAmount(): Observable<number> {
    return of(5);
  }

  public getVotesSpent(): Observable<number> {
    return this.votedArtworks.pipe(map(artworks => artworks.length));
  }

  setVoted(selection: MasonryItem[]) {
    this.votedArtworks.next(selection);
  }

  getVoted$(): Observable<MasonryItem[]> {
    return this.votedArtworks.pipe();
  }

  getVoted(): MasonryItem[] {
    return this.votedArtworks.getValue();
  }
}
