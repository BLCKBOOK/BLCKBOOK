import { TransactionOperation, TransactionWalletOperation, TezosToolkit, ContractMethodObject, ContractMethod } from "@taquito/taquito";
import { Contract } from "./Contract";

export class AuctionHouseContract extends Contract {
    constructor(auctionHouseContractAddress: string, tezosToolkit: TezosToolkit) {
        super(auctionHouseContractAddress, tezosToolkit);
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

    async end_auction(auction_index: number, confirmations = 3) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methods.end_auction(auction_index).send();
            const hash: any | undefined = await call?.confirmation(confirmations);
            console.log(`Operation injected: https://hangzhou.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }
}