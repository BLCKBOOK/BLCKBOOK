import {Component, Input, OnInit} from '@angular/core';
import {findIconDefinition} from '@fortawesome/fontawesome-svg-core';
import {VoteDetailData} from '../detail-view-dialog/detail-view-dialog.component';
import {VotingService} from '../voting.service';
import {from, Observable} from 'rxjs';
import {ArtworkData} from '../../shared/artwork-data/artwork-data.component';
import {TaquitoService} from '../../taquito/taquito.service';
import {BlockchainService} from '../../services/blockchain.service';
import {ConfirmDialogComponent, ConfirmDialogData} from '../../components/confirm-dialog/confirm-dialog.component';
import {environment} from '../../../environments/environment';
import {DialogService} from '../../services/dialog.service';
import {LoadingDialogComponent, LoadingDialogData} from '../../components/loading-dialog/loading-dialog.component';

@Component({
  selector: 'app-vote-detail',
  templateUrl: './vote-detail.component.html',
  styleUrls: ['./vote-detail.component.scss', './../../shared/styles/detail.component.scss']
})
export class VoteDetailComponent implements OnInit {

  @Input() data: VoteDetailData;

  timeDisplay: string;
  faSprayCan = findIconDefinition({prefix: 'fas', iconName: 'spray-can'});
  faSlash = findIconDefinition({prefix: 'fas', iconName: 'slash'});
  faMapPin = findIconDefinition({prefix: 'fas', iconName: 'map-pin'});
  faRedo = findIconDefinition({prefix: 'fas', iconName: 'redo'});
  canNotVote$: Observable<boolean>;
  @Input() withinDialog: boolean;

  votingService: VotingService;
  artworkData: ArtworkData;
  ipfsUri: string;
  metadataUri: string;


  constructor(private TaquitoService: TaquitoService, private taquitoService: TaquitoService, private blockchainService: BlockchainService,
              private dialogService: DialogService) {
  }

  ngOnInit(): void {
    this.votingService = this.data.votingService;
    this.canNotVote$ = this.votingService.getCanNotVote();
    const date = new Date(this.data.artwork.uploadTimestamp);
    this.timeDisplay = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    this.ipfsUri = this.data.artwork.artifactIPFSLink;
    this.metadataUri = this.data.artwork.metadataIPFSLink;
    this.artworkData = {
      title: this.data.artwork.title,
      uploader: this.data.artwork.uploader,
      latitude: this.data.artwork.latitude,
      longitude: this.data.artwork.longitude,
    };
  }

  vote(): void {
    /*this.data.voted = true;*/
    const dialogRef = this.dialogService.open(ConfirmDialogComponent, {
      data: {
        text: `You can only vote ${environment.maxVoteAmount} times per voting-period and can not take back any votes.`,
        header: 'VOTING',
        action: 'Submit Vote'
      } as ConfirmDialogData
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const dialogRef2 = this.dialogService.open(LoadingDialogComponent, {
          width: '90%',
          data: {
            text: `Vote is being processed`,
            header: 'VOTING',
          } as LoadingDialogData
        });
        from(this.blockchainService.calculateVotingParams(parseInt(this.data.artwork.artworkId), this.data.artwork.index)).subscribe(params => {
          this.votingService.vote(params).then(success => {
            if (success) {
              this.data.voted = true;
            }
            dialogRef2.close();
          });
        });
      }
    });
  }

  reconnectWallet() {
    this.TaquitoService.connect();
  }
}
