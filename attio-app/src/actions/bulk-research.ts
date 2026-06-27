import type { App } from "attio";
import { showToast } from "attio/client";

export const bulkResearchAction: App.Record.BulkAction = {
  id: "bulk-research",
  label: "Research candidates",
  objects: ["people"],
  onTrigger: async () => {
    await showToast({
      title: "Recruiting Copilot",
      text: "Bulk research (max 5) ships in Phase 2.",
      variant: "neutral",
    });
  },
};
