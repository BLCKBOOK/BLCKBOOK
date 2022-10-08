import { UploadedArtworkIndex, UploadedArtwork } from "../tableDefinitions";
import { DeleteItemCommand, DeleteItemCommandOutput, DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { DeleteObjectCommand, DeleteObjectCommandOutput, S3Client } from "@aws-sdk/client-s3";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { createError } from "@middy/util";

export const deleteArtwork = async (index: UploadedArtworkIndex, s3Client: S3Client, ddbClient: DynamoDBClient) => {
    // get Item to delete
    const getArtworkCommand = new GetItemCommand({
        TableName: process.env['UPLOADED_ARTWORKS_TABLE_NAME'],
        Key: marshall(index)
    })
    const deleteItemResponse = (await ddbClient.send(getArtworkCommand)).Item
    if (!deleteItemResponse)
        return Promise.reject(createError(404, "The item to be deleted could not be found"))
    const itemToDelete = unmarshall(deleteItemResponse) as UploadedArtwork;

    const deletePromises: Promise<DeleteItemCommandOutput | DeleteObjectCommandOutput>[] = []

    // delete item from DynamoDB
    const deleteArtworkCommand = new DeleteItemCommand({
        TableName: process.env['UPLOADED_ARTWORKS_TABLE_NAME'],
        Key: marshall(index)
    })
    deletePromises.push(ddbClient.send(deleteArtworkCommand).catch(err => {
        console.error("could not delete artwork item", JSON.stringify(deleteArtworkCommand));
        console.error(err);
        return Promise.reject(createError(500, `Error during deletion`,{expose:true}))
    }))

    // delete Images from S3
    Object.keys(itemToDelete.imageUrls).forEach(key => {
        const s3Key = new URL(itemToDelete.imageUrls[key]).pathname
        const deleteImageCommand = new DeleteObjectCommand({
            Bucket: process.env['ARTWORK_UPLOAD_S3_BUCKET_NAME'],
            Key: s3Key
        })
        deletePromises.push(s3Client.send(deleteImageCommand).catch(err => {
            console.error("could not delete artwork image", JSON.stringify(deleteImageCommand));
            console.error(err);
            return Promise.reject(createError(500, `Error during deletion`))
        }))
    })

    await Promise.all(deletePromises)
}
