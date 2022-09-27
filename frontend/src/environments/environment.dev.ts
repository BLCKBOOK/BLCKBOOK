import awsmobile from '../aws-exports';

export const environment = {
  production: true,
  urlString: awsmobile.aws_cloud_logic_custom ? awsmobile.aws_cloud_logic_custom[0].endpoint : '',
  tokenContractAddress: 'KT1SrzXWY3cb5WPdPH7ohDSniXgaQnTXWaRR',
  voterMoneyPoolContractAddress: 'KT1BrdmuEpUuGLC9gDQX5wCA3JKujxcLziAM',
  auctionHouseContractAddress: 'KT1KfF7JUoES4JNVfMENfPbKgypCGkfJtFP2',
  theVoteContractAddress: 'KT19JNAtKLaStQRE4Lb5LQYWF5NcheQ46WCj',
  sprayContractAddress : 'KT1HKjdGT6xtiMVE6GFai8ypK91uU59E7Enr',
  bankContractAddress: 'KT1K6ZTTv9Bf9coECtUEadjFRoKAR4z36ZiA',
  tzktAddress: 'https://api.ghostnet.tzkt.io/v1/',
  cryptoNet: 'ghostnet',
  pinataGateway: 'https://blckbook.mypinata.cloud/ipfs/',
  taquitoRPC: 'https://rpc.ghostnet.teztnets.xyz',
  maxVoteAmount: 5,
  maxConcurrency: 10,
  unknownTagTitle: 'Unknown',
};
