import {Component, Input, OnInit} from '@angular/core';
import {findIconDefinition} from '@fortawesome/fontawesome-svg-core';
import {AuctionDetailData} from '../detail-view-dialog/detail-view-auction-dialog.component';
import {Clipboard} from '@angular/cdk/clipboard';
import {SnackBarService} from '../../services/snack-bar.service';
import {ErrorStateMatcher} from '@angular/material/core';
import {FormControl, FormGroupDirective, NgForm, Validators} from '@angular/forms';
import {isNumeric} from 'rxjs/internal-compatibility';
import {BlockchainService} from '../../services/blockchain.service';
import {BehaviorSubject} from 'rxjs';
import {TzktAuction, TzKtAuctionHistoricalKey} from '../../types/tzkt.auction';
import {CurrencyService} from '../../services/currency.service';
import Dinero from 'dinero.js';
import {BeaconService} from '../../beacon/beacon.service';
import {UserService} from '../../services/user.service';
import {ArtworkData} from '../../shared/artwork-data/artwork-data.component';

/** Error when invalid control is dirty, touched, or submitted. */
export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-auction-detail',
  templateUrl: './auction-detail.component.html',
  styleUrls: ['./auction-detail.component.scss', './../../shared/styles/detail.component.scss']
})
export class AuctionDetailComponent implements OnInit {

  @Input() data: AuctionDetailData;

  timeDisplay: string;
  faSlash = findIconDefinition({prefix: 'fas', iconName: 'slash'});
  faRedo = findIconDefinition({prefix: 'fas', iconName: 'redo'});
  auctionOver = false;
  minAuctionBidString: string;
  minAuctionBid: Dinero.Dinero;
  currentBidString: string;
  auctionEnded: boolean;
  readonly bidStepThreshold = '100000';
  noBidsYet: boolean = false;
  currentOwner: string;

  bidFormControl = new FormControl('', [Validators.required]);

  bidErrorMatcher = new MyErrorStateMatcher();

  auctionStartKey: TzKtAuctionHistoricalKey | undefined;
  auctionEndKey: TzKtAuctionHistoricalKey | undefined;
  bidHistory: BehaviorSubject<TzktAuction[]> = new BehaviorSubject<TzktAuction[]>([]);
  ipfsUri: string;
  metadataUri: string;
  auctionStartDate: string;
  auctionEndDate: string;
  walletID: string; // wallet Id of logged-in user
  currentBidPending: boolean = false;

  private readonly mutezRegex = '\\d*\\.?\\d?\\d?\\d?\\d?\\d?\\d?$';
  artworkData: ArtworkData;

  constructor(private clipboard: Clipboard, private snackBarService: SnackBarService, private beaconService: BeaconService,
              private blockchainService: BlockchainService, private currencyService: CurrencyService, private userService: UserService) {
  }

  ngOnInit(): void {
    this.artworkData = {
      titel: this.data.mintedArtwork.title,
      uploader: this.data.mintedArtwork.uploader,
      longitude: this.data.mintedArtwork.longitude,
      latitude: this.data.mintedArtwork.latitude,
    };
    const end_date = new Date(this.data.auctionKey.value.end_timestamp);
    this.timeDisplay = end_date.toLocaleDateString() + ' ' + end_date.toLocaleTimeString();
    this.auctionOver = (new Date().getTime() > end_date.getTime());
    this.auctionEnded = !this.data.auctionKey.active;
    this.currentBidString = this.currencyService.getTezAmountFromMutez(this.data.auctionKey.value.bid_amount);
    this.minAuctionBid = this.currencyService.mutezToDinero(this.data.auctionKey.value.bid_amount).add(this.currencyService.mutezToDinero(this.bidStepThreshold));
    this.minAuctionBidString = this.currencyService.getAmountInTez(this.minAuctionBid);
    this.bidFormControl.addValidators(Validators.min(parseFloat(this.minAuctionBidString)));
    this.bidFormControl.addValidators(Validators.pattern(this.mutezRegex));
    this.bidFormControl.setValue(this.minAuctionBidString);
    this.blockchainService.getHistoricalKeysOfAuction(this.data.auctionKey.key).subscribe(res => {
      this.auctionEndKey = res.find(historicalKey => historicalKey.action === 'remove_key');
      if (this.auctionEndKey) {
        const end_date = new Date(this.auctionEndKey.timestamp);
        this.auctionEndDate = end_date.toLocaleDateString() + ' ' + end_date.toLocaleTimeString();
      }
      this.auctionStartKey = res.find(historicalKey => historicalKey.action === 'add_key');
      if (this.auctionStartKey) {
        const end_date = new Date(this.auctionStartKey.timestamp);
        this.auctionStartDate = end_date.toLocaleDateString() + ' ' + end_date.toLocaleTimeString();
      }
      const updates = res.filter(historicalKey => historicalKey.action === 'update_key').reverse();
      this.bidHistory.next(updates.map(historicalKey => historicalKey.value));
    });
    this.blockchainService.getArtworkMetadata(this.data.auctionKey.key).subscribe(metadata => {
      this.metadataUri = metadata;
      this.blockchainService.getArtifactUriFromMetadataAddress(metadata).subscribe(artifact => {
        this.ipfsUri = artifact;
      });
    });
    if (this.data.auctionKey.value.uploader === this.data.auctionKey.value.bidder) {
      this.noBidsYet = true;
    }
    this.userService.getUserInfo().subscribe(info => {
      if (info && info.walletId) {
        this.walletID = info.walletId;
      }
    });
    if (this.auctionOver) {
      this.blockchainService.getTokenHolder(this.data.auctionKey.key).subscribe(holderList => {
        this.currentOwner = Object.keys(holderList)[0];
      });
    }
  }

  bid(key: string) {
    if (this.bidFormControl.value && isNumeric(this.bidFormControl.value)) {
      const mutezAmount = this.bidFormControl.value as number * 1000000;
      this.beaconService.bid(key, mutezAmount.toString()).then(successful => {
        if (successful) {
          this.currentBidPending = true;
        }});
    } else {
      this.snackBarService.openSnackBarWithoutAction('Some error in the bid-amount');
    }
  }

  reconnectWallet() {
    this.beaconService.connect();
  }
}
