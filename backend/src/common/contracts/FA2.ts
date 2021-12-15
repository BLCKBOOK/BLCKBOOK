import { MichelsonMap, TransactionOperation, TransactionWalletOperation, TezosToolkit, ContractMethod } from "@taquito/taquito";
import { Contract } from "./Contract";

function char2Bytes(str: string) {
    return Buffer.from(str, 'utf8').toString('hex');
}

export class FA2Contract extends Contract {
    constructor(tokenContractAddress: string, tezosToolkit: TezosToolkit) {
        super(tokenContractAddress, tezosToolkit);
    }

    mint(ipfsLink: string, tokenId: number, ownerAddress: string) {
        const storageMap = new MichelsonMap({
            prim: 'map',
            args: [{ prim: 'string' }, { prim: 'bytes' }],
        });
        storageMap.set('decimals', char2Bytes('0'));
        storageMap.set('', char2Bytes(ipfsLink));
        return this.contract?.methods.mint(
            ownerAddress, 1, storageMap, tokenId
        ) as ContractMethod<any>
    }

    async getCurrentTokenIndex(): Promise<number | undefined> {
        try {
            const storage = await this.contract?.storage();
            return (storage as any).all_tokens.toNumber() as number;
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }
}