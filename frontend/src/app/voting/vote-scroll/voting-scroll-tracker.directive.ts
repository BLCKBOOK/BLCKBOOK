import {Directive, EventEmitter, HostListener, Output} from '@angular/core';

@Directive({
  selector: '[appVoteScrollTracker]'
})
export class VotingScrollTrackerDirective {
  @Output() scrollingFinished = new EventEmitter<void>();

  emitted = false;
  emittedLimit = 500;

  @HostListener('window:resize', []) // this also continues the reload if we resize;
  @HostListener('window:scroll', [])
  onScroll(): void {
    if ((window.innerHeight + window.scrollY + this.emittedLimit) >= document.body.offsetHeight && !this.emitted) {
      this.emitted = true;
      this.scrollingFinished.emit();
      setTimeout(() => this.emitted = false, 500); // if the data takes more than 1sec to load we load even more data;
    }
  }
}
