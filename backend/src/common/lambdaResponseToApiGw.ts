type Impossible<K extends keyof any> = {
    [P in K]: never;
};

export type NoExtraProperties<T, U extends T = T> = U & Impossible<Exclude<keyof U, keyof T>>;

export interface LambdaResponseToApiGw {
    isBase64Encoded?: true | false,
    statusCode: Number,
    headers?: { [headerName: string]: string },
    body: string
}