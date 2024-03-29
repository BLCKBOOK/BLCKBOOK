// WARNING: DO NOT EDIT.  This file is automatically generated
// Written by aws-amplify-serverless-plugin/1.4.1 on 2022-09-29T22:29:19.810Z

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
            endpoint: 'https://c7kqqn31jg.execute-api.eu-west-1.amazonaws.com/prod',
            name: 'ApiGatewayRestApi',
            region: 'eu-west-1'
        }
    ],
    aws_cognito_identity_pool_id: 'eu-west-1:0fbd7c06-a39f-4de3-96d5-14b3a47c6bcd',
    aws_cognito_region: 'eu-west-1',
    aws_project_region: 'eu-west-1',
    aws_user_pools_id: 'eu-west-1_mNnazKOjR',
    aws_user_pools_web_client_id: '68pn57i168ub4ho4h74tg8h39k'
};

export default awsmobile;
