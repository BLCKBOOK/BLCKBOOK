import { Injectable } from '@angular/core';
import {BehaviorSubject, from, Observable, ReplaySubject, Subject} from 'rxjs';
import {VoteMasonryItem} from './vote-scroll/voting-scroll.component';
import {map} from 'rxjs/operators';
import { VotableArtwork } from '../../../../backend/src/common/tableDefinitions';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {ImageSizeService} from '../services/image-size.service';
import {SnackBarService} from '../services/snack-bar.service';
import {UpdateService} from '../services/update.service';
import {BlockchainService} from '../services/blockchain.service';
import {UserService} from '../services/user.service';

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
  private votedArtworks: BehaviorSubject<VoteMasonryItem[]> = new BehaviorSubject<VoteMasonryItem[]>([]);
  private readonly maxVoteAmount: BehaviorSubject<number> = new BehaviorSubject<number>(5);
  private readonly alreadyVoted: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private myUpload: Subject<VotableArtwork> = new ReplaySubject<VotableArtwork>(1);
  private walletID: string;

  constructor(private httpClient: HttpClient, private imageSizeService: ImageSizeService, private snackBarService: SnackBarService,
              private updateService: UpdateService, private blockchainService: BlockchainService, private userService: UserService) {
    this.updateService.getUpdateEvent$().subscribe(() => {
      this.initialize();
    });
  }

  private initialize() {
    this.updateVotingStatus();
  }

  public updateVotingStatus() {
    this.userService.requestUserInfo().subscribe(info => {
      if (info && info.walletId) {
        this.walletID = info.walletId;
        this.blockchainService.getAmountOfVotesLeft(this.walletID).subscribe(votesLeft => {
          if (votesLeft === 0) {
            this.alreadyVoted.next(true);
          } else {
            this.alreadyVoted.next(false);
          }
        })
        from(this.blockchainService.getUserUpload(this.walletID)).subscribe(upload => {
          if (upload) {
            this.myUpload.next(upload);
          }
        })
        this.getMyVotes$().subscribe(votes => {
          const items: VoteMasonryItem[] = [];
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
            } as VoteMasonryItem;
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
      } else {
        console.error('no user-data so not able to vote')
      }
    });
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
    } as VoteMasonryItem;
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

  setVoted(selection: VoteMasonryItem[]) {
    this.votedArtworks.next(selection);
  }

  getVotedArtworks$(): Observable<VoteMasonryItem[]> {
    return this.votedArtworks.pipe();
  }

  getVotedArtworks(): VoteMasonryItem[] {
    return this.votedArtworks.getValue();
  }

  private getMyVotes$(): Observable<VotableArtwork[]> {
    return from(this.blockchainService.getMyVotes(this.walletID));
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

  public async getVotableArtworkById(artwork_id: string): Promise<VotableArtwork> {
    return await this.blockchainService.getVotableArtworkById(artwork_id);
  }
}
