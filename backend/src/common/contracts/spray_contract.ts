import {
    MichelsonMap,
    TezosToolkit,
    TransactionOperation,
    TransactionWalletOperation
} from '@taquito/taquito';
import {Contract} from './contract';
import {char2Bytes} from '@taquito/tzip16';
import assert from 'assert';

export class SprayContract extends Contract {

    constructor(protected tezos: TezosToolkit, address: string) {
        super(tezos, address);
    }

    async set_the_vote(theVoteAddress: string) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methods.set_the_vote(theVoteAddress).send();
            const hash: any | undefined = await call?.confirmation(2);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    // Was only used to get the parameters but kept in the code to know how to get it
    async getMintParameter() {
        const ret = await this.contract?.methodsObject.mint().getSignature();
        console.log(ret);
        console.log(ret.token);
    }

    async mint(receiver: string, amount: number, variant : 'existing' | 'new', id?: number, metadata?: string) {
        try {
            let token;
            if (variant === 'new') {
                assert(metadata);
                const storageMap = new MichelsonMap({
                    prim: 'map',
                    args: [{prim: 'string'}, {prim: 'bytes'}],
                });
                storageMap.set('decimals', char2Bytes('0'));
                storageMap.set('', char2Bytes(metadata));

                token = {new: storageMap};
                   /* { existing: 'nat', new: { map: { key: 'string', value: 'bytes' } } }*/
            }
            else {
                assert(id !== undefined);
                token = {existing: id};
            }

            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methodsObject.mint({to_: receiver, amount: amount, token: token}).send();
            const hash: any | undefined = await call?.confirmation(2);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }
}

