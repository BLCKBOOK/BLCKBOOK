import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

import middy from "@middy/core";
import validator from "@middy/validator";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import httpJsonBodyParser from "@middy/http-json-body-parser";

import { UpdateUploadedArtworksResponseBody, RequestValidationSchema, UpdateUploadedArtworksRequestBody } from "./apiSchema";
import { marshall } from "@aws-sdk/util-dynamodb";
import { LambdaResponseToApiGw } from "../../../common/lambdaResponseToApiGw";
import AuthMiddleware from "../../../common/AuthMiddleware";
import RequestLogger from "../../../common/RequestLogger";
import { BankContract } from "../../../common/contracts/bank_contract";
import { TezosToolkit } from "@taquito/taquito";
import { getTezosActivatorAccount } from "../../../common/SecretsManager";
import { setUser } from "../../../common/setUser";

const DDBclient = new DynamoDBClient({ region: process.env['AWS_REGION'] });

let returnObject: UpdateUploadedArtworksResponseBody;

const baseHandler = async (event, context): Promise<LambdaResponseToApiGw> => {
  
  const bankContractAddress = process.env['BANK_CONTRACT_ADDRESS']
  if(!bankContractAddress)
  throw new Error('BANK_CONTRACT_ADDRESS not set')

  const tzktAddress = process.env['TZKT_ADDRESS']
  if(!tzktAddress)
  throw new Error('TZKT_ADDRESS not set')
  
  const rpc = process.env['TEZOS_RPC_CLIENT_INTERFACE'];
  if (!rpc) throw new Error(`TEZOS_RPC_CLIENT_INTERFACE env variable not set`)

  const tezos = new TezosToolkit(rpc);
  
  const activatrAdmin = await getTezosActivatorAccount()
  setUser(tezos, activatrAdmin)

  const bankContract = new BankContract(tezos, bankContractAddress)
  await bankContract.ready

  const body: UpdateUploadedArtworksRequestBody = event.body;
  
  if(!bankContract.userIsRegistered(body.walletId)) 
    bankContract.registerUser(body.walletId)

  const userId = event.requestContext.authorizer.claims['sub'];
  
  const updateUserCommand = new UpdateItemCommand({
    TableName: process.env['USER_INFO_TABLE_NAME'],
    Key: marshall({ userId }),
    UpdateExpression: "set walletId = :newWalletId",
    ExpressionAttributeValues: marshall({ ":newWalletId": body.walletId }),
    ReturnValues: "UPDATED_NEW",
  });
  await DDBclient.send(updateUserCommand)

  returnObject = "WalletId set"
  return { statusCode: 200, headers: { "content-type": "text/plain" }, body: returnObject };
}

const handler = middy(baseHandler)
  .use(httpErrorHandler())
  .use(cors({ origin: process.env['FRONTEND_HOST_NAME'] }))
  .use(httpJsonBodyParser())
  .use(RequestLogger())
  .use(validator({ inputSchema: RequestValidationSchema }))
  .use(AuthMiddleware(['User', 'Admin']))

module.exports = { handler }