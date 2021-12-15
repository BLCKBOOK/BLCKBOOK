import {
    ContractAbstraction, TezosToolkit,
} from '@taquito/taquito';

/**
 * abstract class for a contract. Has a ready for initialization so that we can call other methods on it
 */
export abstract class Contract {
    public Ready: Promise<void>;
    protected contract: ContractAbstraction<any> | undefined;

    protected constructor(contractAddress: string, tezosToolkit: TezosToolkit) {
        this.Ready = new Promise((resolve, reject) => {
            tezosToolkit.contract.at(contractAddress).then(result => {
                this.contract = result;
                resolve(undefined);
            }).catch(reject);
        });
    }
}