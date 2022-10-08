export interface TzktAuctionKey extends TzktBigMapKey {
    value: TzktAuction,
}

export interface TzktBigMapKey {
    active: boolean,
    firstLevel: number,
    hash: string,
    id: number,
    key: string
    lastLevel: number,
    updates: number,
}

export interface TzktAuction {
    bid_amount: string,
    bidder: string,
    end_timestamp: string,
    uploader: string,
    voter_amount: string,
}

export interface VoteContractHistoryEntry {
    id: number,
    level: number
    timestamp: string,
    operation: VoteContractOperation,
    value: VoteStorage
}

export interface VoteContractOperation {
    type?: string,
    hash?: string,
    counter?: number,
    nonce?: number,
    parameter: TxParameter,
}

export interface TxParameter {
    entrypoint: string,
    value: any
}

export interface VoteStorage {
    administrator: string,
    admissions_this_period: string,
    all_artworks: string,
    artwork_data: number,
    artworks_to_mint: string[],
    auction_house_address: string,
    deadline: string,
    highest_vote_index: string,
    lowest_vote_index: string,
    metadata: string,
    minting_ratio: string,
    minting_ready_batch_counter: string,
    minting_ready_index: string,
    minting_ready_limit: string,
    next_deadline_minutes: string,
    ready_for_minting: string,
    spray_bank_address: string,
    spray_contract_address: string,
    tokens_contract_address: string,
    vote_register: number,
    voter_money_pool_address: string,
    votes: number,
    votes_transmission_batch_counter: string,
    votes_transmission_limit: string,
}
