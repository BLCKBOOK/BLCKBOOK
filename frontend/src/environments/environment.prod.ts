import awsmobile from '../aws-exports';

export const environment = {
  production: true,
  urlString: awsmobile.aws_cloud_logic_custom ? awsmobile.aws_cloud_logic_custom[0].endpoint : '',
  tokenContractAddress: "KT1KykSaEqmCvXcitjcB2X5RdFVkb573i2eD",
  voterMoneyPoolContractAddress: "KT1WZzWgCYqf5mzxNEbrJt5vnu1mwZbRik8A",
  auctionHouseContractAddress: "KT1M64RNqyFQXqC88VrgVwhLNh9zV5LGxAEP",
  theVoteContractAddress: "KT1FNMheKDiHghHpCbr44BQVYdt8fzsUrJ3i",
  sprayContractAddress: "KT19FhN97AK6NerSR6LTQswGo3jyTEMwgjbn",
  bankContractAddress: "KT1HzbYjjgCS7tF4BzhsHBioYKZwWmdFG9eo",
  tzktAddress: 'https://api.ghostnet.tzkt.io/v1/',
  cryptoNet: 'ghostnet', // ToDo: change all of these to mainnet
  pinataGateway: 'https://blckbook.mypinata.cloud/ipfs/',
  taquitoRPC: 'https://rpc.ghostnet.teztnets.xyz',
  maxVoteAmount: 5,
  maxConcurrency: 10,
  unknownTagTitle: 'Unknown',
};
