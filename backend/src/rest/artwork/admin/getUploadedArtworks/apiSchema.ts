import { UploadedArtwork, UploadedArtworkIndex } from "../../../../common/tableDefinitions";


export interface GetUploadedArtworksResponseBody { artworks: UploadedArtwork[], lastKey: UploadedArtworkIndex }
