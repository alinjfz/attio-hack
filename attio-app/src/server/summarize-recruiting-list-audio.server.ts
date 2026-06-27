import { ATTIO_API_TOKEN } from "attio/server";
import { listRecruitingListRecordIds } from "@recruiting-copilot/core/attio";
import batchSummarizeAudioForRecords from "./batch-summarize-audio.server";

export default async function summarizeRecruitingListAudio() {
  const recordIds = await listRecruitingListRecordIds({ apiToken: ATTIO_API_TOKEN });
  if (recordIds.length === 0) {
    throw new Error("The recruiting list has no candidates.");
  }
  return batchSummarizeAudioForRecords(recordIds);
}
