import awsmobile from "../aws-exports";

export const environment = {
  production: true,
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
