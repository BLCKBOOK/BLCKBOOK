export interface TzktVotesRegisterBigMapKey extends TzktBigMapKey {
    value: string[];
}

export interface TzktArtworkInfoBigMapKey extends TzktBigMapKey {
    value: ArtworkInfoValue;
}


export interface ArtworkInfoValue {
    uploader: string,
    /**
     * be aware that these are hash-values!
     */
    artwork_info: ArtworkInfo
}

export interface ArtworkInfo {
    "": string,
    decimals: number
}

export interface TzktBigMapKey {
    active: boolean,
    firstLevel: number,
    hash: string,
    id: number,
    key: string
    lastLevel: number,
    updates: number,
}
