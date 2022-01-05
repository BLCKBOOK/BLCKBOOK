import {Injectable} from '@angular/core';
import { TezosToolkit } from '@taquito/taquito';
import {tzip16, Tzip16Module} from '@taquito/tzip16';
import {environment} from '../../environments/environment';



@Injectable({
  providedIn: 'root'
})
export class TaquitoService {

  private tezos;

  constructor() {
    this.tezos = new TezosToolkit(environment.taquitoRPC);
    this.tezos.addExtension(new Tzip16Module());
  }

  async getVoteMoneyPoolAmountOfAddress(address: string): Promise<string> {
    const contract = await this.tezos.contract.at(environment.voterMoneyPoolContractAddress, tzip16);
    const views = await contract.tzip16().metadataViews();
    return (await views.get_balance().executeView(address));
  }
}
