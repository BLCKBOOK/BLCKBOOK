import { Component } from '@angular/core';
import {VotingService} from '../../services/voting.service';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-voting',
  templateUrl: './voting.component.html',
  styleUrls: ['./voting.component.scss']
})
export class VotingComponent {

  $totalVoteAmount: Observable<number>;
  $votesSpend: Observable<number>;

  constructor(private votingService: VotingService) {
    this.$totalVoteAmount = this.votingService.getMaxVoteAmount();
    this.$votesSpend = this.votingService.getVotesSpent();
  }


}
