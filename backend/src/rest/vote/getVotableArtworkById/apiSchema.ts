import { VotableArtwork } from "../../../common/tableDefinitions";

export type getVoteableArtworksPageRequestPathParam = string;

export type getVoteableArtworksPageResponseBody = Omit<VotableArtwork, "votes">