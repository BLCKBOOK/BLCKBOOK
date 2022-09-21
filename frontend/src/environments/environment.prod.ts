import awsmobile from '../aws-exports';

export const environment = {
  production: true,
  urlString: awsmobile.aws_cloud_logic_custom ? awsmobile.aws_cloud_logic_custom[0].endpoint : '',
  tokenContractAddress: 'KT1Nqn4twmvFssgnwhgkjFeMsHiceg1tZbKV',
  voterMoneyPoolContractAddress: 'KT1Ats6HPT2ePmwY37QXbedm9noiXocNAwS8',
  auctionHouseContractAddress: 'KT1CNZsuSMFpkGN1D3gAkQtfnTGMzaRk1JBM',
  theVoteContractAddress: 'KT1NXAMxDzSjgFv6L3Z7WW6HNUbBY2rHXaVV',
  sprayContractAddress : 'KT1FSCVnbU1oNhUz52u6SBDfmfQo38du7ivH',
  bankContractAddress: 'KT1FSCVnbU1oNhUz52u6SBDfmfQo38du7ivH',
  tzktAddress: 'https://api.ghostnet.tzkt.io/v1/',
  cryptoNet: 'ghostnet', // ToDo: change all of these to mainnet
  pinataGateway: 'https://blckbook.mypinata.cloud/ipfs/',
  taquitoRPC: 'https://rpc.ghostnet.teztnets.xyz',
  maxVoteAmount: 5,
  maxConcurrency: 10,
};
