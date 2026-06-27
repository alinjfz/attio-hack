import { ATTIO_API_TOKEN } from "attio/server";
import { patchPerson } from "@recruiting-copilot/core";

export default async function saveCvText(recordId: string, cvText: string): Promise<void> {
  await patchPerson({ apiToken: ATTIO_API_TOKEN }, recordId, { cvText });
}
