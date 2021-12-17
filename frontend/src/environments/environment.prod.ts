import awsmobile from "../aws-exports";

export const environment = {
  production: true,
  urlString: awsmobile.aws_cloud_logic_custom ?  awsmobile.aws_cloud_logic_custom[0].endpoint : "",
  auctionHouseContractAddress: 'KT1RG8SzC5exEXedFEpFwjisuAcjjf7TTwNB',
  tokenContractAddress: 'KT1HAtdXKvXqK2He3Xr2xmHQ9cYrxPTL7X9Z',
  voterMoneyPoolContractAddress: 'KT1XeA6tZYeBCm7aux3SAPswTuRE72R3VUCW',
  tzktAddress: 'https://api.hangzhou2net.tzkt.io/v1/',
  cryptoNet: 'mainnet',
};
