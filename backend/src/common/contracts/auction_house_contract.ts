import {Contract} from './contract';
import {TezosToolkit, TransactionOperation, TransactionWalletOperation} from '@taquito/taquito';
import fetch from 'node-fetch';
import {auctionHouseContractAddress, maxConcurrency, tzktAddress} from './constants';
import {TzktAuctionKey} from './types';

export class AuctionHouseContract extends Contract {
    constructor(protected tezos: TezosToolkit, address: string) {
        super(tezos, address);
    }

    async create_auction(auction_and_token_id: number, bid_amount: number, end_timestamp: string, uploader: string, voter_amount: number, confirmations = 3) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methodsObject.create_auction({
                auction_and_token_id,
                bid_amount,
                end_timestamp,
                uploader,
                voter_amount
            }).send();
            const hash: any | undefined = await call?.confirmation(confirmations);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async set_voter_money_pool_address(new_address: string, confirmations = 3) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methods.set_voter_money_pool_address(new_address).send();
            const hash: any | undefined = await call?.confirmation(confirmations);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async set_tokens_contract_address(new_address: string, confirmations = 3) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methods.set_tokens_contract_address(new_address).send();
            const hash: any | undefined = await call?.confirmation(confirmations);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async set_blckbook_collector(new_address: string, confirmations = 3) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methods.set_blckbook_collector(new_address).send();
            const hash: any | undefined = await call?.confirmation(confirmations);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    end_auction(auction_index: number) {
            return this.contract?.methods.end_auction(auction_index);
    }

    // Also must be an Batch-Call
    /**
     * If you get the exception "VOTER_MONEY_POOL_NOT_ADMIN" set the Auction-Contract address of the VOTER_MONEY_POOL!
     */
    async endExpiredAuctions(): Promise<any> {
        let loadLimit = maxConcurrency;
        let index = 0

        const timeString = new Date(Date.now()).toString();
        let auctions:TzktAuctionKey[] = [];
        do {
            let actualOffset = loadLimit * index;
            const auctionRequest = await fetch(`${tzktAddress}contracts/${auctionHouseContractAddress}/bigmaps/auctions/keys?limit=${loadLimit}&offset=${actualOffset}&value.end_timestamp.lt=${timeString}`);
            auctions = (await auctionRequest.json()) as TzktAuctionKey[];
            index++;

            const batch = this.tezos.wallet.batch();
            for (let auction of auctions) {
                if (this.contract) {
                    batch.withContractCall(this.contract.methods.end_auction(auction.key));
                }
            }
            /*
             * Here happens all the operation batching
             */
            const batchOp = await batch.send();
            const confirmation = await batchOp.confirmation(1);
            console.log(`Operation injected: https://ghost.tzstats.com/${confirmation.block.hash}`);

            console.log(auctions.map(auction => auction.key));
        } while(auctions.length)
    }



}
