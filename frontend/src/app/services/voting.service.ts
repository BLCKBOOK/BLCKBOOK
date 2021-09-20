import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {MasonryItem} from '../components/scroll/scroll.component';
import {map} from 'rxjs/operators';
import { VotableArtwork } from '../../../../backend/src/common/tableDefinitions';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VotingService {

  private readonly voteAPIURL = environment.urlString + '/vote';
  private readonly getVotePageURL = '/getPage';
  private votesLeft: number;
  private votedArtworks: BehaviorSubject<MasonryItem[]> = new BehaviorSubject<MasonryItem[]>([]);

  constructor(private httpClient: HttpClient) {
    this.votesLeft = 0;
  }

  public getMaxVoteAmount(): Observable<number> {
    return of(5);
  }

  public getVotesSpent(): Observable<number> {
    return this.votedArtworks.pipe(map(artworks => artworks.length));
  }

  public getVotableArtworks(pagenumber: number): Observable<VotableArtwork[]> {
    const urlString = this.voteAPIURL + this.getVotePageURL + '/' + pagenumber.toString();
    return this.httpClient.get<VotableArtwork[]>(urlString);
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
