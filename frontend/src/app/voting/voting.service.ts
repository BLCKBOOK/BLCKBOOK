import { Injectable } from '@angular/core';
import {BehaviorSubject, firstValueFrom, from, Observable, ReplaySubject, Subject} from 'rxjs';
import {VoteBlockchainItem, VoteMasonryItem} from './vote-scroll/voting-scroll.component';
import {map} from 'rxjs/operators';
import {HttpClient, HttpParams} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {ImageSizeService} from '../services/image-size.service';
import {SnackBarService} from '../services/snack-bar.service';
import {UpdateService} from '../services/update.service';
import {BlockchainService} from '../services/blockchain.service';
import {UserService} from '../services/user.service';
import {TaquitoService} from '../taquito/taquito.service';

@Injectable({
  providedIn: 'root'
})
export class VotingService {
  private votedArtworks: BehaviorSubject<VoteMasonryItem[]> = new BehaviorSubject<VoteMasonryItem[]>([]);
  private readonly maxVoteAmount: BehaviorSubject<number> = new BehaviorSubject<number>(environment.maxVoteAmount);
  private readonly alreadyVoted: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private myUpload: Subject<VoteBlockchainItem> = new ReplaySubject<VoteBlockchainItem>(1);
  private walletID: string;

  constructor(private httpClient: HttpClient, private imageSizeService: ImageSizeService, private snackBarService: SnackBarService,
              private updateService: UpdateService, private blockchainService: BlockchainService, private userService: UserService,
              private taquitoService: TaquitoService) {
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
        })
      } else {
        console.error('no user-data so not able to vote')
      }
    });
  }

  public getMasonryItemOfArtwork(artwork: VoteBlockchainItem, voted?: boolean) {
    const title = artwork.title;
    const url = this.imageSizeService.get1000WImage(artwork.imageUrls);
    const srcSet = this.imageSizeService.calculateSrcSetString(artwork.imageUrls);
    const actuallyVoted = voted ?? this.getVotedArtworks().some(item => item.artwork.artworkId === artwork.artworkId);
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

  setVoted(selection: VoteMasonryItem[], newItem: VoteMasonryItem) {
    from(this.blockchainService.calculateVotingParams(parseInt(newItem.artwork.artworkId), newItem.artwork.index)).subscribe(params => {
      this.taquitoService.vote(params).then(() => newItem.voted = true);
    });
  }

  getVotedArtworks$(): Observable<VoteMasonryItem[]> {
    return this.votedArtworks.pipe();
  }

  getVotedArtworks(): VoteMasonryItem[] {
    return this.votedArtworks.getValue();
  }

  private getMyVotes$(): Observable<VoteBlockchainItem[]> {
    return from(this.blockchainService.getMyVotes(this.walletID));
  }

  public getMyUpload(): Observable<VoteBlockchainItem> {
    return this.myUpload.pipe();
  }

  public async getVotableArtworkByArtworkId(artwork_id: string): Promise<VoteBlockchainItem> {
    let params = new HttpParams().set('path', 'admissions_this_period');
    const admissions_this_period = parseInt(await firstValueFrom(this.httpClient.get<string>(environment.tzktAddress + 'contracts/' + environment.theVoteContractAddress + '/storage', {params})));
    params = new HttpParams().set('path', 'all_artworks');
    const all_artworks = parseInt(await firstValueFrom(this.httpClient.get<string>(environment.tzktAddress + 'contracts/' + environment.theVoteContractAddress + '/storage', {params})));
    const index = parseInt(artwork_id) - (all_artworks - admissions_this_period);
    return await this.blockchainService.getVotableArtworkById(artwork_id, index);
  }
}
