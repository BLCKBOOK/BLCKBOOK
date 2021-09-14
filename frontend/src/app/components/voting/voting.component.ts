import { Component } from '@angular/core';
import {VotingService} from '../../services/voting.service';
import {Observable} from 'rxjs';
import {combineLatest} from 'rxjs';
import {map, startWith} from 'rxjs/operators';

@Component({
  selector: 'app-voting',
  templateUrl: './voting.component.html',
  styleUrls: ['./voting.component.scss']
})
export class VotingComponent {

  $totalVoteAmount: Observable<number>;
  $votesSpend: Observable<number>;
  $submitDisabled: Observable<boolean>;

  constructor(private votingService: VotingService) {
    this.$totalVoteAmount = this.votingService.getMaxVoteAmount();
    this.$votesSpend = this.votingService.getVotesSpent();
    this.$submitDisabled = combineLatest([this.$totalVoteAmount, this.$votesSpend]).pipe(map(([totalVoteAmount, votesSpend]) => {
      return votesSpend === 0 || totalVoteAmount < votesSpend;
    }, startWith(false)));
  }
}
