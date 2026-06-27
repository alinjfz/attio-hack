import type { App } from "attio";
import { runResearchForRecord } from "../record/research-flow";

export const researchCandidateAction: App.Record.Action = {
  id: "research-candidate",
  label: "Research candidate",
  icon: "Search",
  objects: ["people"],
  onTrigger: async ({ recordId }) => {
    await runResearchForRecord({
      recordId,
      candidateName: "Candidate",
    });
  },
};
