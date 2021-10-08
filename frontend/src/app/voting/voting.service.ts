import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable, ReplaySubject, Subject} from 'rxjs';
import {MasonryItem} from './scroll/scroll.component';
import {map} from 'rxjs/operators';
import { VotableArtwork } from '../../../../backend/src/common/tableDefinitions';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {ImageSizeService} from '../services/image-size.service';
import {SnackBarService} from '../services/snack-bar.service';
import {UpdateService} from '../services/update.service';

@Injectable({
  providedIn: 'root'
})
export class VotingService {

  private readonly voteAPIURL = environment.urlString + '/vote';
  private readonly getVotePageURL = '/getPage';
  private readonly voteForArtworksURL = '/voteForArtworks';
  private readonly getMyVotesURL = '/getMyVotes';
  private readonly getArtworkByIdURL = '/getVotableArtwork'
  private readonly getMyUploadURL = '/getMyProposition'
  private votedArtworks: BehaviorSubject<MasonryItem[]> = new BehaviorSubject<MasonryItem[]>([]);
  private readonly maxVoteAmount: BehaviorSubject<number> = new BehaviorSubject<number>(5);
  private readonly alreadyVoted: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private myUpload: Subject<VotableArtwork> = new ReplaySubject<VotableArtwork>(1);

  constructor(private httpClient: HttpClient, private imageSizeService: ImageSizeService, private snackBarService: SnackBarService, private updateService: UpdateService) {
    this.updateService.getUpdateEvent$().subscribe(() => {
      this.initialize();
    });
  }

  private initialize() {
    this.updateVotingStatus();
    this.httpClient.get<VotableArtwork>(this.voteAPIURL + this.getMyUploadURL).subscribe(upload => {
      this.myUpload.next(upload);
    });
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
        this.alreadyVoted.next(false);
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

  private getMyVotes$(): Observable<VotableArtwork[]> {
    return this.httpClient.get<VotableArtwork[]>(this.voteAPIURL + this.getMyVotesURL);
  }

  public voteForArtworks() {
    const actualVotes = this.votedArtworks.getValue();
    const voteAmount = actualVotes.length;
    if (voteAmount <= this.maxVoteAmount.getValue() && voteAmount > 0) {
      const artworkIDs = this.votedArtworks.getValue().map(artwork => artwork.artwork.artworkId);
      this.httpClient.post(this.voteAPIURL + this.voteForArtworksURL, artworkIDs, {responseType: 'text'})
        .subscribe(() => {
          this.snackBarService.openSnackBarWithoutAction('The vote was successfully cast', 2000);
          this.updateVotingStatus();
        });
    } else {
      console.error('had too many votes');
    }
  }

  public getMyUpload(): Observable<VotableArtwork> {
    return this.myUpload.pipe();
  }

  public getVotableArtworkById(id: string): Observable<VotableArtwork> {
    return this.httpClient.get<VotableArtwork>(this.voteAPIURL + this.getArtworkByIdURL + '/' + id);
  }
}
