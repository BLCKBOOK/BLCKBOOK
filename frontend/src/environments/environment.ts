// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import awsmobile from "../aws-exports";

export const environment = {
  production: false,
  urlString: awsmobile.aws_cloud_logic_custom ?  awsmobile.aws_cloud_logic_custom[0].endpoint : "",
  auctionHouseContractAddress: 'KT1RG8SzC5exEXedFEpFwjisuAcjjf7TTwNB',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
