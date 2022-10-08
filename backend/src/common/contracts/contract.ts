import {ContractAbstraction, TezosToolkit} from '@taquito/taquito';

/**
 * abstract class for a contract. Has a ready for initialization so that we can call other methods on it
 */
export abstract class Contract {
    public ready: Promise<void>;
    protected contract: ContractAbstraction<any> | undefined;
    private readonly address: string

    protected constructor(protected tezos: TezosToolkit, contractAddress: string) {
        this.address = contractAddress;
        this.ready = new Promise((resolve, reject) => {
            this.tezos.contract.at(contractAddress)
                .then((result: ContractAbstraction<any>) => {
                    this.contract = result;
                    resolve(undefined);
                }).catch(reject);
        });
    }
}
