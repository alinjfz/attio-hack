import { ATTIO_API_TOKEN } from "attio/server";
import { getPersonAudioSummaryScript } from "@recruiting-copilot/core/attio";

export default async function getAudioSummaryScript(
  recordId: string,
): Promise<string | undefined> {
  return getPersonAudioSummaryScript({ apiToken: ATTIO_API_TOKEN }, recordId);
}
