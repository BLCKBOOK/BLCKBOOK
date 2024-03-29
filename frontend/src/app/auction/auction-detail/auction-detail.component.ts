import {Component, Input, OnInit} from '@angular/core';
import {findIconDefinition} from '@fortawesome/fontawesome-svg-core';
import {AuctionDetailData} from '../detail-view-dialog/detail-view-auction-dialog.component';
import {Clipboard} from '@angular/cdk/clipboard';
import {SnackBarService} from '../../services/snack-bar.service';
import {ErrorStateMatcher} from '@angular/material/core';
import {UntypedFormControl, FormGroupDirective, NgForm, Validators} from '@angular/forms';
import {BlockchainService} from '../../services/blockchain.service';
import {BehaviorSubject} from 'rxjs';
import {TzktTypes, TzKtAuctionHistoricalKey} from '../../types/tzkt.types';
import {CurrencyService} from '../../services/currency.service';
import Dinero from 'dinero.js';
import {UserService} from '../../services/user.service';
import {ArtworkData} from '../../shared/artwork-data/artwork-data.component';
import {TaquitoService} from '../../taquito/taquito.service';

/** Error when invalid control is dirty, touched, or submitted. */
export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: UntypedFormControl | null, form: FormGroupDirective | NgForm | null): boolean {
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

  bidFormControl = new UntypedFormControl('', [Validators.required]);

  bidErrorMatcher = new MyErrorStateMatcher();

  auctionStartKey: TzKtAuctionHistoricalKey | undefined;
  auctionEndKey: TzKtAuctionHistoricalKey | undefined;
  bidHistory: BehaviorSubject<TzktTypes[]> = new BehaviorSubject<TzktTypes[]>([]);
  ipfsUri: string;
  metadataUri: string;
  auctionStartDate: string;
  auctionEndDate: string;
  walletID: string; // wallet Id of logged-in user
  currentBidPending: boolean = false;

  private readonly mutezRegex = '\\d*\\.?\\d?\\d?\\d?\\d?\\d?\\d?$';
  artworkData: ArtworkData;

  constructor(private clipboard: Clipboard, private snackBarService: SnackBarService, private taquitoService: TaquitoService,
              private blockchainService: BlockchainService, private currencyService: CurrencyService, private userService: UserService) {
  }

  ngOnInit(): void {
    this.artworkData = {
      title: this.data.title,
      uploader: this.data.uploader,
      longitude: this.data.longitude,
      latitude: this.data.latitude,
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
      this.artworkData.metadataLink = metadata;
      this.blockchainService.getArtifactUriFromMetadataAddress(metadata).subscribe(artifact => {
        this.artworkData.ipfsLink = artifact;
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
        if (holderList.length !== 1) {
          console.error('we somehow have multiple token owners at the same time');
        }
        this.currentOwner = holderList[0].key.address;
      });
    }
  }

  bid(key: string) {
    if (this.bidFormControl.value && this.isNumeric(this.bidFormControl.value)) {
      const mutezAmount = this.bidFormControl.value as number * 1000000;
      this.taquitoService.bid(key, mutezAmount.toString()).then(successful => {
        if (successful) {
          this.currentBidPending = true;
        }
      });
    } else {
      this.snackBarService.openSnackBarWithoutAction('Some error in the bid-amount');
    }
  }

  reconnectWallet() {
    this.taquitoService.connect();
  }

  isNumeric(str: any): boolean {
    if (typeof str === 'number') return true; // if we have a number the value is numeric
    if (typeof str != 'string') return false; // we only process strings!
    return !isNaN(Number(str)) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
      !isNaN(parseFloat(str)); // ...and ensure strings of whitespace fail
  }
}
