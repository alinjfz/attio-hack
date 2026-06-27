import type { App } from "attio";
import { showToast } from "attio/client";

export const researchCandidateAction: App.Record.Action = {
  id: "research-candidate",
  label: "Research candidate",
  icon: "Search",
  objects: ["people"],
  onTrigger: async () => {
    await showToast({
      title: "Recruiting Copilot",
      text: "Research action will open the approval flow in Phase 2.",
      variant: "neutral",
    });
  },
};
