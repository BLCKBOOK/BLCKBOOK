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

export const tokenMetadataIPFSHASH = 'QmchAqaHk7eBDxHEYK6QyekoBW9QFVuXN8qnft3w3PVArG';
export const sprayMetadataIPFSHASH = 'QmZRCk4poGaJbHbJvhNdZcSY6kDBeJNbyhVBz2CS7MsQBZ';
export const voterMoneyPoolMetadataIPFSHASH = 'Qme5PQCgnXWA332yuLSyDdknM4wwBjtaQKxMLnimWY6yA8';
export const auctionHouseMetadataIPFSHASH = 'QmXqb1KFmP3TbgD2JvartMiY5EmEK1RW61ybTD673dPzA6';

export const voteMetadataIPFSHASH = 'Qmbzz5JKi8Zz3NNuk2yh4V7Epkc1Ggrea9nYArqaqwd5h4';
export const sprayTOKENMetadata = 'QmQF9wr2ccULRkk9vqhZ3XdiEjYgz2MpcvkSA1fF2oEMgK';

export const tzktAddress = 'https://api.ghostnet.tzkt.io/v1/'
export const maxConcurrency = 64;
