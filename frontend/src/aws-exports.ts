// WARNING: DO NOT EDIT.  This file is automatically generated
// Written by aws-amplify-serverless-plugin/1.4.1 on 2021-09-11T04:23:22.558Z

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
            endpoint: 'https://g386gouqdk.execute-api.eu-west-1.amazonaws.com/dev',
            name: 'ApiGatewayRestApi',
            region: 'eu-west-1'
        }
    ],
    aws_cognito_identity_pool_id: 'eu-west-1:c87cd581-dc9e-41e7-bbd7-0cc4a93bc352',
    aws_cognito_region: 'eu-west-1',
    aws_project_region: 'eu-west-1',
    aws_user_pools_id: 'eu-west-1_MIQOuPpJ5',
    aws_user_pools_web_client_id: '1dr3m1der7nug49b3vlai4h61c'
};

export default awsmobile;
