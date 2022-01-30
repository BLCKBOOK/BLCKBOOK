import { UploadedArtwork } from "../../../common/tableDefinitions";
import { NoExtraProperties } from "../../../common/lambdaResponseToApiGw";

export type getCurrentImageResponse = NoExtraProperties<Omit<UploadedArtwork, "approvalState">>