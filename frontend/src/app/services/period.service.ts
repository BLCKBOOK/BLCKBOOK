import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {interval, Observable, ReplaySubject, Subject} from 'rxjs';
import {BlockchainService} from './blockchain.service';

@Injectable({
  providedIn: 'root'
})
export class PeriodService {

  private currentDeadline$: Subject<number> = new ReplaySubject<number>(1);
  private periodEnded$: Subject<void> = new Subject<void>();
  private currentDeadline: number;
  private deadlineHasPassed = false;

  constructor(private httpClient: HttpClient, private blockchainService: BlockchainService) {
    this.updateDeadline();
    interval(6000).subscribe(() => {
      this.updateDeadline();
    });
  }

  private updateDeadline() {
    this.blockchainService.getVotingPeriodEndMS().subscribe(deadline => {
      if (!this.deadlineHasPassed && this.currentDeadline == deadline && deadline < Date.now()) {
        this.deadlineHasPassed = true;
        this.periodEnded$.next();
      }
      if (this.currentDeadline !== deadline) {
        console.log('the deadline changed!');
        this.currentDeadline$.next(deadline);
        this.currentDeadline = deadline;
        this.deadlineHasPassed = false;
      }
    });
  }

  public getPeriodEnded$(): Observable<void> {
    return this.periodEnded$.pipe()
  }

  public getDeadline(): Observable<Number> {
    return this.currentDeadline$.pipe();
  }

  public getCurrentDeadlineString(): Observable<string> {
    return this.blockchainService.getVotingPeriodEnd();
  }
}
