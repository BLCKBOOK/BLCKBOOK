import {S3} from "aws-sdk"
const s3Client = new S3();

export default {
    async get(fileName, bucket) {
        const params = {
            Bucket: bucket,
            Key: fileName,
        };

        let data = (await s3Client.getObject(params).promise());


        if (!data || !data.$response) {
            throw Error(`Failed to get file ${fileName}, from ${bucket}`);
        }

        if (fileName.slice(fileName.length - 4, fileName.length) == 'json') {
            return data.Body.toString();
        }
        return data;
    },
    async write(data, fileName, bucket) {
        const params = {
            Bucket: bucket,
            Body: JSON.stringify(data),
            Key: fileName,
        };

        const newData = await s3Client.putObject(params).promise();

        if (!newData) {
            throw Error('there was an error writing the file');
        }

        return newData;
    },
};
