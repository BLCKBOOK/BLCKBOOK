import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {MasonryItem} from '../components/scroll/scroll.component';
import {map} from 'rxjs/operators';
import { VotableArtwork } from '../../../../backend/src/common/tableDefinitions';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {ImageSizeService} from './image-size.service';

@Injectable({
  providedIn: 'root'
})
export class VotingService {

  private readonly voteAPIURL = environment.urlString + '/vote';
  private readonly getVotePageURL = '/getPage';
  private readonly voteForArtworksURL = '/voteForArtworks';
  private readonly getMyVotesURL = '/getMyVotes';
  private readonly getArtworkByIdURL = '/getVotableArtwork'
  private votedArtworks: BehaviorSubject<MasonryItem[]> = new BehaviorSubject<MasonryItem[]>([]);
  private readonly maxVoteAmount: BehaviorSubject<number> = new BehaviorSubject<number>(5);
  private readonly alreadyVoted: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(private httpClient: HttpClient, private imageSizeService: ImageSizeService) {
    this.updateVotingStatus();
  }

  public updateVotingStatus() {
    this.getMyVotes$().subscribe(votes => {
      const items: MasonryItem[] = [];
      votes.forEach(artwork => {
        const title = artwork.title;
        const url = this.imageSizeService.get1000WImage(artwork.imageUrls);
        const srcSet = this.imageSizeService.calculateSrcSetString(artwork.imageUrls);
        const voted = true;
        const item = {
          title: title,
          srcSet: srcSet,
          img: url,
          voted: voted,
          artwork: artwork
        } as MasonryItem;
        items.push(item);
      });
      this.votedArtworks.next(items);
      this.alreadyVoted.next(true);
    }, error => {
      if (error.status === 404) {
        this.votedArtworks.next([]);
      }
    })
  }

  public getMasonryItemOfArtwork(artwork: VotableArtwork, voted?: boolean) {
    const title = artwork.title;
    const url = this.imageSizeService.get1000WImage(artwork.imageUrls);
    const srcSet = this.imageSizeService.calculateSrcSetString(artwork.imageUrls);
    const actuallyVoted = voted ?? this.getVotedArtworks().some(item => item.srcSet === srcSet);
    return {
      title: title,
      srcSet: srcSet,
      img: url,
      voted: actuallyVoted,
      artwork: artwork
    } as MasonryItem;
  }

  public getHasVoted$(): Observable<boolean> {
    return this.alreadyVoted.pipe();
  }

  public getMaxVoteAmount$(): Observable<number> {
    return this.maxVoteAmount.pipe();
  }

  public getMaxVoteAmount(): number {
    return this.maxVoteAmount.getValue();
  }

  public getVotesSelected$(): Observable<number> {
    return this.votedArtworks.pipe(map(artworks => artworks.length));
  }

  public getVotableArtworks$(pagenumber: number): Observable<VotableArtwork[]> {
    const urlString = this.voteAPIURL + this.getVotePageURL + '/' + pagenumber.toString();
    return this.httpClient.get<VotableArtwork[]>(urlString);
  }

  setVoted(selection: MasonryItem[]) {
    this.votedArtworks.next(selection);
  }

  getVotedArtworks$(): Observable<MasonryItem[]> {
    return this.votedArtworks.pipe();
  }

  getVotedArtworks(): MasonryItem[] {
    return this.votedArtworks.getValue();
  }

  public getMyVotes$(): Observable<VotableArtwork[]> {
    return this.httpClient.get<VotableArtwork[]>(this.voteAPIURL + this.getMyVotesURL);
  }

  public voteForArtworks() {
    const actualVotes = this.votedArtworks.getValue();
    const voteAmount = actualVotes.length;
    if (voteAmount <= this.maxVoteAmount.getValue() && voteAmount > 0) {
      const artworkIDs = this.votedArtworks.getValue().map(artwork => artwork.artwork.artworkId);
      this.httpClient.post(this.voteAPIURL + this.voteForArtworksURL, artworkIDs, {responseType: 'text'})
        .subscribe(() => {
          this.updateVotingStatus();
        });
    } else {
      console.error('had too many votes');
    }
  }

  public getVotableArtworkById(id: string): Observable<VotableArtwork> {
    return this.httpClient.get<VotableArtwork>(this.voteAPIURL + this.getArtworkByIdURL + '/' + id);
  }
}
