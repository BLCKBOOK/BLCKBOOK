import {Injectable} from '@angular/core';
import {BehaviorSubject, combineLatest, firstValueFrom, from, Observable, ReplaySubject, Subject} from 'rxjs';
import {VoteBlockchainItem, VoteMasonryItem} from './vote-scroll/voting-scroll.component';
import {HttpClient, HttpParams} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {ImageSizeService} from '../services/image-size.service';
import {SnackBarService} from '../services/snack-bar.service';
import {UpdateService} from '../services/update.service';
import {BlockchainService, VoteParams} from '../services/blockchain.service';
import {UserService} from '../services/user.service';
import {TaquitoService} from '../taquito/taquito.service';
import {map, skip} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class VotingService {
  private votedArtworks: BehaviorSubject<VoteMasonryItem[]> = new BehaviorSubject<VoteMasonryItem[]>([]);
  private readonly maxVoteAmount: BehaviorSubject<number> = new BehaviorSubject<number>(environment.maxVoteAmount);
  private readonly allVotesSpent: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private myUpload: Subject<VoteBlockchainItem> = new ReplaySubject<VoteBlockchainItem>(1);
  private votesSpent$: Subject<number> = new ReplaySubject<number>(1);
  private registered$: Subject<boolean> = new ReplaySubject<boolean>(1);
  private walletID: string;
  private deadlineHasPassed: Subject<boolean> = new ReplaySubject<boolean>(1);

  constructor(private httpClient: HttpClient, private imageSizeService: ImageSizeService, private snackBarService: SnackBarService,
              private updateService: UpdateService, private blockchainService: BlockchainService, private userService: UserService,
              private taquitoService: TaquitoService) {
    this.updateService.getUpdateEvent$().subscribe(() => {
      this.initialize();
    });
    this.updateService.getPeriodEnded$().pipe(skip(1)).subscribe(() => {
      this.updateDeadlineHasPassed();
    });
  }

  private initialize() {
    this.updateVotingStatus();
  }

  private updateDeadlineHasPassed() {
    this.blockchainService.getVotingPeriodEndMS().subscribe(deadline => {
      if (deadline > Date.now()) {
        this.deadlineHasPassed.next(false);
      } else {
        this.deadlineHasPassed.next(true);
      }
    });
  }

  public updateVotingStatus() {
    this.userService.getUserInfo().subscribe(info => {
      this.updateDeadlineHasPassed();
      if (info && info.walletId) {
        this.walletID = info.walletId;
        this.blockchainService.userIsRegistered(info.walletId).subscribe(registered => {
          if (!registered) {
            this.snackBarService.openSnackBarWithNavigation('You are not registered to vote yet', 'register', '/wallet');
          }
          this.registered$.next(registered);
        });
        this.blockchainService.getAmountOfVotesLeft(this.walletID).subscribe(votesLeft => {
          if (votesLeft === 0) {
            this.allVotesSpent.next(true);
          } else {
            this.allVotesSpent.next(false);
          }
          this.votesSpent$.next(this.maxVoteAmount.getValue() - votesLeft);
        });
        from(this.blockchainService.getUserUpload(this.walletID)).subscribe(upload => {
          if (upload) {
            this.myUpload.next(upload);
          }
        });
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
        });
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

  public getCanNotVote(): Observable<boolean> {
    return combineLatest([this.allVotesSpent.pipe(), this.registered$.pipe(), this.deadlineHasPassed]).pipe(map(([allVotesSpent, registered, deadlinePassed]) => {
      return allVotesSpent || !registered || deadlinePassed;
    }));
  }

  public getMaxVoteAmount$(): Observable<number> {
    return this.maxVoteAmount.pipe();
  }

  public getMaxVoteAmount(): number {
    return this.maxVoteAmount.getValue();
  }

  public getVotesSpentAmount$(): Observable<number> {
    return this.votesSpent$.pipe();
  }

  async voteArtwork(newItem: VoteMasonryItem): Promise<void> {
    const params = await this.blockchainService.calculateVotingParams(parseInt(newItem.artwork.artworkId), newItem.artwork.index);
    const success = await this.vote(params);
    if (success) {
      newItem.voted = success;
    }
  }

  async vote(params: VoteParams): Promise<boolean> {
    const voteAmount = this.getVotedArtworks().length;
    const successful = await this.taquitoService.vote(params);
    if (successful) {
      this.snackBarService.openSnackBarWithoutAction('Vote was successful', 10000);
      let newVoteAmount;
      const walletId = (await firstValueFrom(this.userService.getUserInfo()))?.walletId;
      let newVotes = [];
      if (walletId) {
        do {
          newVotes = await this.blockchainService.getMyVotes(this.walletID);
          newVoteAmount = newVotes.length;
          if (newVoteAmount < voteAmount) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } while (newVoteAmount < voteAmount);
        this.votedArtworks.next(newVotes.map(artwork => this.getMasonryItemOfArtwork(artwork, true)));
        const votesLeft = await firstValueFrom(this.blockchainService.getAmountOfVotesLeft(walletId));
        if (votesLeft === 0) {
          this.allVotesSpent.next(true);
        }
        this.votesSpent$.next(this.maxVoteAmount.getValue() - votesLeft);
      }

    } else {
      this.snackBarService.openSnackBarWithoutAction('Vote was not cast');
    }
    return successful;
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
