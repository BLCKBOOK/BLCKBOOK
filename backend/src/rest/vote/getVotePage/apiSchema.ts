import { VotableArtwork } from "../../../common/tableDefinitions";

export type getVoteableArtworksPageRequestQueryParam = { pagenumber: number };

export type getVoteableArtworksPageResponseBody = Omit<VotableArtwork, "votes">[]