import { Injectable } from '@angular/core';
import Dinero from 'dinero.js';

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  constructor() { }

  addMutez(mutezAmount1: string, mutezAmount2: string): Dinero.Dinero {
    return this.mutezToDinero(mutezAmount1).add(this.mutezToDinero(mutezAmount2));
  }

  mutezToDinero(mutezAmount: string): Dinero.Dinero {
    return Dinero({amount: parseInt(mutezAmount), precision: 6});
  }

  getTezAmountFromMutez(mutezAmount: string) {
    return this.getAmountInTez(this.mutezToDinero(mutezAmount));
  }

  getAmountInTez(dinero: Dinero.Dinero): string {
    const amount = dinero.getAmount();
    let format;
    if (amount % 10 !== 0) {
      format = '0.000000';
    }
    else if (amount % 100 !== 0) {
      format = '0.00000';
    }
    else if (amount % 1000 !== 0) {
      format = '0.0000';
    }
    else if (amount % 10000 !== 0) {
      format = '0.000';
    }
    else if (amount % 100000 !== 0) {
      format = '0.00';
    }
    else if (amount % 1000000 !== 0) {
      format = '0.0';
    }
    else {
      format = '0';
    }
    return dinero.toFormat(format)
  }
}
