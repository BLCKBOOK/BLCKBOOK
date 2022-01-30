import { VotableArtwork } from "../../../common/tableDefinitions";

export type getVoteableArtworksPageResponseBody = Omit<VotableArtwork, "votes">