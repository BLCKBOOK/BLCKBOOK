import { TransactionOperation, TransactionWalletOperation, TezosToolkit, ContractMethodObject, ContractMethod } from "@taquito/taquito";
import { Contract } from "./Contract";
export class AuctionHouseContract extends Contract {
    auctionHouseContractAddress: string;
    constructor(auctionHouseContractAddress: string, tezosToolkit: TezosToolkit) {
        super(auctionHouseContractAddress, tezosToolkit);
        this.auctionHouseContractAddress = auctionHouseContractAddress;
    }

    create_auction(auction_and_token_id: number, bid_amount: number, end_timestamp: string, uploader: string, voter_amount: number) {
        return this.contract?.methods.create_auction(
            auction_and_token_id,
            bid_amount,
            end_timestamp,
            uploader,
            voter_amount
        ) as ContractMethod<any>;
    }

    get_expired_auctions(timestamp: string) {
        return this.contract?.methods.get_expired_auctions(timestamp) as ContractMethod<any>;
    }

    end_auction(auction_index: number, confirmations = 3) {
        return this.contract?.methods.end_auction(auction_index) as ContractMethod<any>;
    }
}