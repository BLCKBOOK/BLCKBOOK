import {
    MichelsonMap,
    TezosToolkit,
    TransactionOperation,
    TransactionWalletOperation,
} from '@taquito/taquito';
import {Contract} from './contract';
import {char2Bytes} from '@taquito/tzip16';
import {ipfsPrefix, theVoteContractAddress, tzktAddress} from './constants';
import fetch from 'node-fetch';
import {VoteContractHistoryEntry, VoteStorage} from './types';

export interface ArtworkParams {
    ipfsLink: string,
    uploader: string,
}

export class TheVoteContract extends Contract {

    constructor(protected tezos: TezosToolkit, address: string) {
        super(tezos, address);
    }

    async batchAdmission(artworks: ArtworkParams[]) {
        const batch = this.tezos.wallet.batch();
        try {
            for (let artwork of artworks) {
                let storageMap = new MichelsonMap({
                    prim: 'map',
                    args: [{prim: 'string'}, {prim: 'bytes'}],
                });
                storageMap.set('decimals', char2Bytes('0'));
                storageMap.set('', char2Bytes(ipfsPrefix + artwork.ipfsLink));
                if (this.contract) {
                    batch.withContractCall(this.contract.methodsObject.admission({
                        uploader: artwork.uploader,
                        metadata: storageMap,
                    }));
                }
            }
            /*
             * Here happens all the operation batching
             */
            const batchOp = await batch.send();
            const confirmation = await batchOp.confirmation(1);
            console.log(`Operation injected: https://ghost.tzstats.com/${confirmation.block.hash}`);
        } catch (error) {
            if (error.name === 'AddressValidationError') {
                const filteredArtworks = artworks.filter(artwork => artwork.uploader !== error.value);
                if (filteredArtworks.length < artworks.length) {
                    await this.batchAdmission(filteredArtworks);
                }
            }
        }
    }

    async ready_for_minting(confirmations = 2) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methods.ready_for_minting().send();
            const hash: any | undefined = await call?.confirmation(confirmations);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async setVotesTransmissionLimitDuringMinting(amount: number): Promise<boolean> {
        do {
            try {
                const call: TransactionWalletOperation | TransactionOperation | undefined
                    = await this.contract?.methods.set_votes_transmission_limit(amount).send();
                const hash: any | undefined = await call?.confirmation(2);
                console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
                return true;
            } catch (error: any) {
                if (error['message'] && (error.message as string).includes('THE_VOTE_CANT_SET_VOTES_TRANSMISSION_LIMIT_DURING_A_BATCH')) {
                    console.log('need to continue to mint artworks until we can set the limit again');
                    await this.mintArtworks(1);
                } else {
                    console.log(`Error: ${JSON.stringify(error, null, 2)}`);
                    return false;
                }
            }
        } while (true);
    }

    async deadlinePassed(): Promise<boolean> {
        const response = await fetch(`${tzktAddress}contracts/${theVoteContractAddress}/storage`);
        const storageData = await response.json();
        console.log(storageData)
        return Date.parse(storageData.deadline) < Date.now();
    }

    async mintArtworksUntilReady(): Promise<boolean> {
        let mintAmount = 115;
        let readyForMintAmount = 256;
        let votesTransmissionAmount = 420; 
        let mintedAll = false;

        if (this.contract) {
            // first try to get the ready_for_minting to work
            do {
                const response = await fetch(`${tzktAddress}contracts/${theVoteContractAddress}/storage`);
                const storageData = await response.json();
                if (storageData.ready_for_minting) {
                    console.log('we are ready for minting');
                    break;
                }
                if (parseInt(storageData.minting_ready_batch_counter) === 0) { // only try to lower the amount if we are not in a batch already
                    const current_limit = parseInt(storageData.minting_ready_limit);
                    if (current_limit !== readyForMintAmount) {
                        console.log('ready for minting not correct');
                        try {
                            const call: TransactionWalletOperation | TransactionOperation | undefined
                                = await this.contract?.methods.set_minting_ready_limit(readyForMintAmount).send();
                            const hash: any | undefined = await call?.confirmation(3);
                            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
                        } catch (error: any) {
                            console.log('could not set the new minting_ready_limit');
                            console.error(error)
                            return false;
                        }
                    }
                }

                try {
                    console.log(readyForMintAmount);
                    const call: TransactionWalletOperation | TransactionOperation | undefined
                        = await this.contract?.methods.ready_for_minting().send();
                    const hash: any | undefined = await call?.confirmation(3);
                    console.log(`Ready_for_minting operation successful: https://ghost.tzstats.com/${hash}`);
                } catch (error: any) {
                    if (error['id'] && (error.id as string).includes('gas_exhausted.operation')) {
                        console.log('we have a gas_exhaustion in ready_for_minting');
                    } else {
                        console.log(`Error: ${JSON.stringify(error, null, 2)}`);
                        return false;
                    }
                    readyForMintAmount = Math.floor(readyForMintAmount / 2);
                    if (readyForMintAmount === 1) {
                        console.log('ready for mint amount is 1 and should not have to be this low');
                        return false;
                    }
                }
            }

            while (true);
            do {
                try {
                    console.log(mintAmount);
                    if (mintAmount === 1) {
                        console.log('mint-amount is 1');
                        const response = await fetch(`${tzktAddress}contracts/${theVoteContractAddress}/storage`);
                        const storageData = await response.json();

                        const current_limit = parseInt(storageData.minting_ready_limit);
                        if (current_limit !== votesTransmissionAmount) {
                            console.log('votes Transmission Amount not correct');
                            try {
                                const call: TransactionWalletOperation | TransactionOperation | undefined
                                    = await this.contract?.methods.set_votes_transmission_limit(votesTransmissionAmount).send();
                                const hash: any | undefined = await call?.confirmation(3);
                                console.log(`Did set the new votes-transmission-limit: https://ghost.tzstats.com/${hash}`);
                            } catch (error: any) {
                                if (error['message'] && (error.message as string).includes('THE_VOTE_CANT_SET_VOTES_TRANSMISSION_LIMIT_DURING_A_BATCH')) {
                                    const success = await this.setVotesTransmissionLimitDuringMinting(votesTransmissionAmount);
                                    if (!success) {
                                        console.log('was not successful finishing the vote');
                                        return false;
                                    }
                                    console.log('had to finish transmitting the vote');
                                } else {
                                    console.log(`Error: ${JSON.stringify(error, null, 2)}`);
                                    console.log('could not set the new votes_transmission_limit');
                                    return false;
                                }
                            }
                        }
                        // if mint amount is ever 1 we need to lower the vote_transmission_limit
                    }
                    const call: TransactionWalletOperation | TransactionOperation | undefined
                        = await this.contract?.methods.mint_artworks(mintAmount).send();
                    const hash: any | undefined = await call?.confirmation(3);
                    console.log(`Mint artworks succeeded: https://ghost.tzstats.com/${hash}`);
                } catch (error: any) {
                    if (error['id'] && (error.id as string).includes('gas_exhausted.operation')) {
                        console.log('we have a gas_exhaustion');
                        if (mintAmount === 1) {
                            votesTransmissionAmount = Math.floor(votesTransmissionAmount / 2);
                            if (votesTransmissionAmount === 1) {
                                console.log('was not able to transmit a single vote... so we are f****');
                                return false;
                            }
                            continue;
                        }
                    } else {
                        console.log(`Error: ${JSON.stringify(error, null, 2)}`);
                        return false;
                    }
                    if (error.with && error.with.string && (error.with.string as string).includes('THE_VOTE_DEADLINE_NOT_PASSED')) {
                        return true;
                    }
                    mintAmount = Math.floor(mintAmount / 5 * 4);
                }
                const response = await fetch(`${tzktAddress}contracts/${theVoteContractAddress}/storage`);
                const storageData = await response.json();

                mintedAll = !(storageData.ready_for_minting);

            } while (!mintedAll);
            console.log('we did it and minted all!');
            return true;
        }
        console.log('contract in the_vote is not defined')
        return false;
    }

    async mintArtworks(amount: number) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methods.mint_artworks(amount).send();
            const hash: any | undefined = await call?.confirmation(2);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    /**
     * this method goes back in the storage-history of theVote contract to find the last time ready_for_minting was called.
     * When this happened the artworks_to_mint
     */
    async calculateArtworksToMintSet(): Promise<VoteStorage | undefined> {
        let lastId: string | undefined = undefined;
        while (true) {
            let params =  (lastId ? new URLSearchParams({lastId: lastId}) : '').toString();
            let searchString = `${tzktAddress}contracts/${theVoteContractAddress}/storage/history/?` + params;
            let response = await fetch(searchString);
            let entries = await response.json() as VoteContractHistoryEntry[];
            let entry = entries.find(entry => entry.operation.parameter?.entrypoint === 'ready_for_minting');
            if (entry) {
                console.log(`we found the last ready_for_minting and have ${entry.value.artworks_to_mint.length} artworks that got minted`);
                return entry.value;
            }
            lastId = entries.at(-1)?.id.toString();
            console.log(lastId);
            if (entries.length === 0) { // this will have gone back to the origination of the contract. So yeah...
                console.log('found nothing for all entries')
                break;
            }
        }
        return undefined;
    }
}

