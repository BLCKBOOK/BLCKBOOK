import awsmobile from '../aws-exports';

export const environment = {
  production: true,
  urlString: awsmobile.aws_cloud_logic_custom ? awsmobile.aws_cloud_logic_custom[0].endpoint : '',
  tokenContractAddress: 'KT1D1hhh4aKTLt79iu4q1M8bfHsUR9cpUKds',
  voterMoneyPoolContractAddress: 'KT1StnQpS86BUw8gjLNU2aVw6qgeuP5szEe7',
  auctionHouseContractAddress: 'KT19ubT4oVE4L4KatHE1WJbPb481fXaumei1',
  theVoteContractAddress: 'KT1KYDPcBS1MCLYRvbYGu1ZLUuhkNNXDyh1B',
  sprayContractAddress : 'KT19umVySWsL8Etkxfrzpbx3dKqTRyBqTamo',
  bankContractAddress: 'KT1VddB9LRnD5reNo2bugLikcxxQ1cHHTFjG',
  tzktAddress: 'https://api.ghostnet.tzkt.io/v1/',
  betterCallDevAddress: 'https://api.better-call.dev/v1/',
  betterCallDevNetwork: 'ghostnet',
  cryptoNet: 'ghostnet',
  pinataGateway: 'https://blckbook.mypinata.cloud/ipfs/',
  taquitoRPC: 'https://rpc.ghostnet.teztnets.xyz',
  maxVoteAmount: 5,
  maxConcurrency: 10,
};
