import awsmobile from '../aws-exports';

export const environment = {
  production: true,
  urlString: awsmobile.aws_cloud_logic_custom ? awsmobile.aws_cloud_logic_custom[0].endpoint : '',
  tokenContractAddress: "KT19p79Nt9ggCCczCFQ8to9Ghc8GCY7pkFhL",
  voterMoneyPoolContractAddress: "KT19DHuVKd95YBcqUknaHa3pJEtRhGRzkH9p",
  auctionHouseContractAddress: "KT1JQnm7Yba5A77wXcLw9MLbRBvvDjhrzdjj",
  theVoteContractAddress: "KT1SRSnNfXVgrP4GCADDGN3FM9LaFM1R67wS",
  sprayContractAddress: "KT1L2VbpkKDkmzvnF7DEcaRvZUapbEWf32qa",
  bankContractAddress: "KT1PQ3DikSMj5uvFPE1oD2xSnqshn34tdmks",
  tzktAddress: 'https://api.tzkt.io/v1/',
  cryptoNet: 'mainnet',
  pinataGateway: 'https://blckbook.mypinata.cloud/ipfs/',
  taquitoRPC: 'https://mainnet.smartpy.io',
  maxVoteAmount: 5,
  maxConcurrency: 10,
  unknownTagTitle: 'Unknown',
};
