import {TezosToolkit, TransactionOperation, TransactionWalletOperation} from '@taquito/taquito';
import {Contract} from './contract';
import fetch from "node-fetch";
import {bankContractAddress, tzktAddress} from './constants';

export class BankContract extends Contract {

    constructor(protected tezos: TezosToolkit, address: string) {
        super(tezos, address);
    }

    async registerUser(address: string) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methods.register_user(address).send();
            const hash: any | undefined = await call?.confirmation(2);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async userIsRegistered(userWallet: string): Promise<boolean> {
        const response = await fetch(tzktAddress + 'contracts/' + bankContractAddress + '/bigmaps/withdrawls/keys/' + userWallet)
        const res = await response.text()
        return Boolean(res)
      }
}
