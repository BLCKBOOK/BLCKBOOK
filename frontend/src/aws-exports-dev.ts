// WARNING: DO NOT EDIT.  This file is automatically generated
// Written by aws-amplify-serverless-plugin/1.4.1 on 2022-09-22T04:05:07.533Z

interface IAWSAmplifyFederatedConfiguration {
    google_client_id?: string;
    facebook_app_id?: string;
    amazon_client_id?: string;
}

interface IAWSAmplifyCloudLogicConfiguration {
    [index: number]: {
        endpoint: string;
        name: string;
        region: string;
    };
}

interface IAWSAmplifyConfiguration {
    aws_appsync_authenticationType?: string;
    aws_appsync_graphqlEndpoint?: string;
    aws_appsync_region?: string;
    aws_cognito_identity_pool_id?: string;
    aws_cognito_region?: string;
    aws_cloud_logic_custom?: IAWSAmplifyCloudLogicConfiguration;
    aws_project_region: string;
    aws_user_files_s3_bucket?: string;
    aws_user_files_s3_bucket_region?: string;
    aws_user_pools_id?: string;
    aws_user_pools_web_client_id?: string;
    aws_user_pools_web_client_secret?: string;
    federated?: IAWSAmplifyFederatedConfiguration;
}

const awsmobile: IAWSAmplifyConfiguration = {
    aws_cloud_logic_custom: [
        {
            endpoint: 'https://7gi6m08p27.execute-api.eu-west-1.amazonaws.com/dev',
            name: 'ApiGatewayRestApi',
            region: 'eu-west-1'
        }
    ],
    aws_cognito_identity_pool_id: 'eu-west-1:05d9d0ea-9551-4faa-821f-14b969fc94c6',
    aws_cognito_region: 'eu-west-1',
    aws_project_region: 'eu-west-1',
    aws_user_pools_id: 'eu-west-1_RPI387l0f',
    aws_user_pools_web_client_id: '6f77gpu3fr2veivkj10ac644u8'
};

export default awsmobile;
