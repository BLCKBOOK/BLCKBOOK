export const ipfsPrefix = 'ipfs://';

if(!process.env['FA2_CONTRACT_ADDRESS'])
throw new Error('FA2_CONTRACT_ADDRESS not set')

if(!process.env['VOTER_MONEY_POOL_CONTRACT_ADDRESS'])
throw new Error('VOTER_MONEY_POOL_CONTRACT_ADDRESS not set')

if(!process.env['AUCTION_HOUSE_CONTRACT_ADDRESS'])
throw new Error('AUCTION_HOUSE_CONTRACT_ADDRESS not set')

if(!process.env['THE_VOTE_CONTRACT_ADDRESS'])
throw new Error('THE_VOTE_CONTRACT_ADDRESS not set')

if(!process.env['BANK_CONTRACT_ADDRESS'])
throw new Error('BANK_CONTRACT_ADDRESS not set')

export const tokenContractAddress = process.env['FA2_CONTRACT_ADDRESS']
export const voterMoneyPoolContractAddress = process.env['VOTER_MONEY_POOL_CONTRACT_ADDRESS'];
export const auctionHouseContractAddress = process.env['AUCTION_HOUSE_CONTRACT_ADDRESS'];
export const theVoteContractAddress = process.env['THE_VOTE_CONTRACT_ADDRESS']
export const bankContractAddress = process.env['BANK_CONTRACT_ADDRESS'];

export const tzktAddress = 'https://api.ghostnet.tzkt.io/v1/'
export const maxConcurrency = 64;
