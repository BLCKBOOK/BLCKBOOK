// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import awsmobile from "../aws-exports";

export const environment = {
  production: false,
  urlString: awsmobile.aws_cloud_logic_custom ?  awsmobile.aws_cloud_logic_custom[0].endpoint : "",
  auctionHouseContractAddress: 'KT1EP3cZPv8tCqCRtuVGwkGHL7JagUigHktw',
  tokenContractAddress: 'KT18tsEcP2KoD3U4EdMUderfmxyWBzgo2QF2',
  voterMoneyPoolContractAddress: 'KT1VxugM5e8sbYza6zL1V6c8cJthyrVKRrEj',
  tzktAddress: 'https://api.hangzhou2net.tzkt.io/v1/',
  betterCallDevAddress: 'https://api.better-call.dev/v1/',
  betterCallDevNetwork: 'hangzhou2net',
  cryptoNet: 'hangzhounet',
  pinataGateway: 'https://gateway.pinata.cloud/ipfs/',
  taquitoRPC: 'https://hangzhounet.api.tez.ie',
};

/*
 * For easier debugging in development mode, you can impo<rt the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
