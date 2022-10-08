import {Contract} from './contract';
import {TezosToolkit} from '@taquito/taquito';

export class AuctionHouseContract extends Contract {
    constructor(protected tezos: TezosToolkit, address: string) {
        super(tezos, address);
    }

    end_auction(auction_index: number) {
            return this.contract?.methods.end_auction(auction_index);
    }
}
