// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import awsmobile from '../aws-exports';

export const environment = {
  production: false,
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

/*
 * For easier debugging in development mode, you can impo<rt the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
