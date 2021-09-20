import { VotableArtwork } from "../../../common/tableDefinitions";

export const asd = {
    "type": "object",
    "properties": {
        "event": {
            "type": "object",
            "properties": {
                "body": {
                    "type": "array",
                    "items": [
                        {
                            "type": "string",
                            "pattern": "\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b"
                        }
                    ]
                }
            },
            "required": [
                "body"
            ]
        }
    },
    "required": [
        "event"
    ]
}

export type getVoteableArtworksPageRequestQueryParam = { artworkIds: string[] };

export type getVoteableArtworksPageResponseBody = string