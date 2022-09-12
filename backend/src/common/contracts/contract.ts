import {ContractAbstraction, TezosToolkit, TransactionOperation, TransactionWalletOperation} from '@taquito/taquito';

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

    public async setAdministrator(adminAddress: string) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methods.set_administrator(adminAddress).send();
            const hash: any | undefined = await call?.confirmation(2);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    public getAddress() {
        return this.address;
    }
}
