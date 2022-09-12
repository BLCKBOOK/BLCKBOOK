import {Contract} from './contract';
import {TezosToolkit, TransactionOperation, TransactionWalletOperation} from '@taquito/taquito';
import {tzip16} from '@taquito/tzip16';

export class VoterMoneyPoolContract extends Contract {
    constructor(protected tezos: TezosToolkit, address: string) {
        super(tezos, address);
    }

    /**
     * should not be called anymore as this is done by the_vote
     * @param auctionAndTokenId
     * @param voterAddresses
     * @param confirmations
     */
    async addVotes(auctionAndTokenId: number, voterAddresses: string[], confirmations = 3) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined = await this.contract?.methods.add_votes(auctionAndTokenId, voterAddresses).send();
            const hash: any | undefined = await call?.confirmation(confirmations);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async getAmountInMoneyPool(address: string): Promise<number> {
        const contract = await this.tezos.contract.at(this.getAddress(), tzip16);
        const views = await contract.tzip16().metadataViews();
        const ret = (await views.get_balance().executeView(address)).toNumber();
        console.log(ret);
        return ret;
    }

    async set_auction_house_address(address: string, confirmations = 2): Promise<void> {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined =
                await this.contract?.methods.set_auction_house_address(address).send();
            const hash: any | undefined = await call?.confirmation(confirmations);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    // TODO add withdraw
    // also check with the view how much we can withdraw. (For tests)
}
