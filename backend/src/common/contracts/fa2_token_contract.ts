import {MichelsonMap, TezosToolkit, TransactionOperation, TransactionWalletOperation} from '@taquito/taquito';
import {char2Bytes} from '@taquito/tzip16';
import {Contract} from './contract';

export class FA2TokenContract extends Contract {
    constructor(protected tezos: TezosToolkit, address: string) {
        super(tezos, address);
    }

    async burn(ownerAddress: string, tokenId: number, confirmations = 3) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined = await this.contract?.methods.burn(ownerAddress, tokenId).send();
            const hash: any | undefined = await call?.confirmation(confirmations);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async mint(ipfsLink: string, tokenId: number, ownerAddress: string, confirmations = 3) {
        const storageMap = new MichelsonMap({
            prim: 'map',
            args: [{prim: 'string'}, {prim: 'bytes'}],
        });
        storageMap.set('decimals', char2Bytes('0'));
        storageMap.set('', char2Bytes(ipfsLink));
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined = await this.contract?.methods.mint(
                ownerAddress, 1, storageMap, tokenId
            ).send();
            const hash: any | undefined = await call?.confirmation(confirmations);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async getCurrentTokenIndex(): Promise<number | undefined> {
        try {
            const storage = await this.contract?.storage();
            return (storage as any).all_tokens.toNumber() as number;
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async printStorage(): Promise<number | undefined> {
        try {
            const storage = await this.contract?.storage();
            console.log(await (storage as any).token_metadata.get(2005));
            return (storage as any).all_tokens.toNumber() as number;
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }
}
