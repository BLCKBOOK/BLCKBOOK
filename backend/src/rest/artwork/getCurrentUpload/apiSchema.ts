import { UploadedArtwork } from "../../../common/tableDefinitions";
import { BaseResponse, NoExtraProperties } from "../../../common/lambdaResponseToApiGw";

interface interrimResponse extends BaseResponse { }

export type getCurrentImageResponse = NoExtraProperties<Omit<UploadedArtwork, "approvalState">>