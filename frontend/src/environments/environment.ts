// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import awsmobile from '../aws-exports';

export const environment = {
  production: false,
  urlString: awsmobile.aws_cloud_logic_custom ? awsmobile.aws_cloud_logic_custom[0].endpoint : '',
  tokenContractAddress: 'KT1Nqn4twmvFssgnwhgkjFeMsHiceg1tZbKV',
  voterMoneyPoolContractAddress: 'KT1Ats6HPT2ePmwY37QXbedm9noiXocNAwS8',
  auctionHouseContractAddress: 'KT1CNZsuSMFpkGN1D3gAkQtfnTGMzaRk1JBM',
  theVoteContractAddress: 'KT1KfttT5ZVLYxi9V8JjrM3Dncg4evdESSyW',
  sprayContractAddress : 'KT1FSCVnbU1oNhUz52u6SBDfmfQo38du7ivH',
  bankContractAddress: 'KT1TYrapwmRFkvHbYWAR3qXxcGXgMjubJvmP',
  tzktAddress: 'https://api.ghostnet.tzkt.io/v1/',
  cryptoNet: 'ghostnet',
  pinataGateway: 'https://blckbook.mypinata.cloud/ipfs/',
  taquitoRPC: 'https://rpc.ghostnet.teztnets.xyz',
  maxVoteAmount: 5,
  maxConcurrency: 10,
  unknownTagTitle: 'Unknown',
};

/*
 * For easier debugging in development mode, you can impo<rt the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
