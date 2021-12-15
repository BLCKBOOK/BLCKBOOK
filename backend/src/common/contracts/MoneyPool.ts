import { TransactionOperation, TransactionWalletOperation, TezosToolkit, ContractMethod } from "@taquito/taquito";
import { Contract } from "./Contract";

export class VoterMoneyPoolContract extends Contract {
    constructor(voterMoneyPoolContractAddress: string, tezosToolkit: TezosToolkit) {
        super(voterMoneyPoolContractAddress, tezosToolkit);
    }

    addVotes(auctionAndTokenId: number, voterAddresses: string[]) {
        return this.contract?.methods.add_votes(auctionAndTokenId, voterAddresses) as ContractMethod<any>;
    }
}