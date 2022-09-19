// requires permission secretsmanager:GetSecretValue

import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

// Use this code snippet in your app.
// If you need more information about configurations or implementing the sample code, visit the AWS docs:
// https://aws.amazon.com/developers/getting-started/nodejs/

// Create a Secrets Manager client
var client = new SecretsManagerClient({region: process.env['AWS_REGION']});

const getSecret = async (secretName: string) =>{
    let data = await client.send(new GetSecretValueCommand({
        SecretId:secretName,
    })) 
    if(!data.SecretString) throw new Error(`Secret ${secretName} does not exist`)
    let secret = JSON.parse(data.SecretString);
    return secret;
} 

export async function getTezosActivatorAccount() {
    if(process.env['STAGE'] === 'dev') {
        return await getSecret('dev/ghostnetFaucet');
    }else{
        return await getSecret('prod/mainnetFaucet');
    }
}

export async function getTezosAdminAccount() {
    if(process.env['STAGE'] === 'dev') {
        return await getSecret('dev/ghostnetFaucet');
    }else{
        return await getSecret('prod/mainnetFaucet');
    }
}

export async function getPinataAccount() {
    return await getSecret('pinataAccessKey');
}
