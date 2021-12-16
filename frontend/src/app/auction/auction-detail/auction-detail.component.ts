import {Component, Input, OnInit} from '@angular/core';
import {findIconDefinition} from '@fortawesome/fontawesome-svg-core';
import {AuctionDetailData} from '../detail-view-dialog/detail-view-auction-dialog.component';
import {Clipboard} from '@angular/cdk/clipboard';
import {SnackBarService} from '../../services/snack-bar.service';
import {Observable} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';
import {MapDialogComponent, MapDialogData} from '../../components/map-dialog/map-dialog.component';
import {BeaconService} from '../../wallet/beacon.service';
import {toNumbers} from '@angular/compiler-cli/src/diagnostics/typescript_version';
import {ErrorStateMatcher} from '@angular/material/core';
import {FormControl, FormGroupDirective, NgForm, Validators} from '@angular/forms';
import {isNumeric} from 'rxjs/internal-compatibility';

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
  minAuctionBid: number;
  readonly bidStepThreshold = 100000;

  bidFormControl = new FormControl('', [Validators.required]);

  bidErrorMatcher = new MyErrorStateMatcher();

  constructor(public dialog: MatDialog, private clipboard: Clipboard,
                private snackBarService: SnackBarService, private beaconService: BeaconService) {
  }

  ngOnInit(): void {
    const end_date = new Date(this.data.auctionKey.value.end_timestamp);

    this.timeDisplay = end_date.toLocaleDateString() + ' ' + end_date.toLocaleTimeString();
    this.auctionOver = (new Date().getDate() > end_date.getDate());
    this.minAuctionBid = (parseInt(this.data.auctionKey.value.bid_amount) + this.bidStepThreshold) / 1000000;
    this.bidFormControl.addValidators(Validators.min(this.minAuctionBid));
    this.bidFormControl.setValue(this.minAuctionBid);
  }


  copyToClipboard() {
    this.clipboard.copy(window.location.href);
    this.snackBarService.openSnackBarWithoutAction('Url copied to clipboard', 2000);
  }

  showOnMap() {
  /*  this.dialog.open(MapDialogComponent, {
      width: '100%',
      maxWidth: '100%',
      data: {latlng: {lat: parseFloat(this.data.artwork.latitude), lng: parseFloat(this.data.artwork.longitude)}} as MapDialogData
    });*/
  }

  bid(key: string) {
    if (this.bidFormControl.value && isNumeric(this.bidFormControl.value)) {
      const mutezAmount = this.bidFormControl.value as number * 1000000;
      this.beaconService.bid(key, mutezAmount.toString());
    } else {
      this.snackBarService.openSnackBarWithoutAction('Some error in the bid-amount');
    }
  }
}
