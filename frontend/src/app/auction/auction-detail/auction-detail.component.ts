import {Component, Input, OnInit} from '@angular/core';
import {findIconDefinition} from '@fortawesome/fontawesome-svg-core';
import {AuctionDetailData} from '../detail-view-dialog/detail-view-auction-dialog.component';
import {Clipboard} from '@angular/cdk/clipboard';
import {SnackBarService} from '../../services/snack-bar.service';
import {MatDialog} from '@angular/material/dialog';
import {MapDialogComponent, MapDialogData} from '../../components/map-dialog/map-dialog.component';
import {BeaconService} from '../../wallet/beacon.service';
import {ErrorStateMatcher} from '@angular/material/core';
import {FormControl, FormGroupDirective, NgForm, Validators} from '@angular/forms';
import {isNumeric} from 'rxjs/internal-compatibility';
import {AuctionService} from '../../services/auction.service';
import {BehaviorSubject} from 'rxjs';
import {TzktAuction} from '../../types/tzkt.auction';
import {CurrencyService} from '../../services/currency.service';
import Dinero from 'dinero.js';

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
  styleUrls: ['./auction-detail.component.scss']
})
export class AuctionDetailComponent implements OnInit {

  @Input() data: AuctionDetailData;

  timeDisplay: string;
  faSlash = findIconDefinition({prefix: 'fas', iconName: 'slash'});
  faShareSquare = findIconDefinition({prefix: 'fas', iconName: 'share-square'});
  faMapPin = findIconDefinition({prefix: 'fas', iconName: 'map-pin'});
  auctionOver = false;
  minAuctionBidString: string;
  minAuctionBid: Dinero.Dinero;
  currentBidString: string;
  auctionEnded: boolean;
  readonly bidStepThreshold = '100000';

  bidFormControl = new FormControl('', [Validators.required]);

  bidErrorMatcher = new MyErrorStateMatcher();

  bidHistory: BehaviorSubject<TzktAuction[]> = new BehaviorSubject<TzktAuction[]>([]);
  noOtherBids: boolean | undefined = undefined;
  ipfsUri: string;
  metadataUri: string;

  constructor(public dialog: MatDialog, private clipboard: Clipboard,
              private snackBarService: SnackBarService, private beaconService: BeaconService, private auctionService: AuctionService,
              private currencyService: CurrencyService) {
  }

  ngOnInit(): void {
    const end_date = new Date(this.data.auctionKey.value.end_timestamp);
    this.timeDisplay = end_date.toLocaleDateString() + ' ' + end_date.toLocaleTimeString();
    this.auctionOver = (new Date().getTime() > end_date.getTime());
    this.auctionEnded = !this.data.auctionKey.active;
    this.currentBidString = this.currencyService.getTezAmountFromMutez(this.data.auctionKey.value.bid_amount);
    this.minAuctionBid = this.currencyService.mutezToDinero(this.data.auctionKey.value.bid_amount).add(this.currencyService.mutezToDinero(this.bidStepThreshold));
    this.minAuctionBidString = this.currencyService.getAmountInTez(this.minAuctionBid);
    this.bidFormControl.addValidators(Validators.min(parseFloat(this.minAuctionBidString)));
    this.bidFormControl.setValue(this.minAuctionBidString);
    this.auctionService.getHistoricalKeysOfAuction(this.data.auctionKey.key).subscribe(res => {
      const updates = res.filter(historicalKey => historicalKey.action === 'update_key');
      this.noOtherBids = updates.length === 0;
      this.bidHistory.next(updates.map(historicalKey => historicalKey.value));
    });
    this.auctionService.getArtworkMetadata(this.data.auctionKey.key).subscribe(metadata => {
      this.metadataUri = metadata;
      this.auctionService.getArtifactUriFromMetadataAddress(metadata).subscribe(artifact => {
        this.ipfsUri = artifact;
      });
    });
  }


  copyToClipboard() {
    this.clipboard.copy(window.location.href);
    this.snackBarService.openSnackBarWithoutAction('Url copied to clipboard', 2000);
  }

  showOnMap() {
    this.dialog.open(MapDialogComponent, {
      width: '100%',
      maxWidth: '100%',
      data: {
        latlng: {
          lat: parseFloat(this.data.mintedArtwork.latitude),
          lng: parseFloat(this.data.mintedArtwork.longitude)
        }
      } as MapDialogData
    });
  }

  bid(key: string) {
    if (this.bidFormControl.value && isNumeric(this.bidFormControl.value)) {
      const mutezAmount = this.bidFormControl.value as number * 1000000;
      this.beaconService.bid(key, mutezAmount.toString()); // ToDo: don't ignore the Promise and do something here
    } else {
      this.snackBarService.openSnackBarWithoutAction('Some error in the bid-amount');
    }
  }

  reconnectWallet() {
    this.beaconService.connect();
  }
}
