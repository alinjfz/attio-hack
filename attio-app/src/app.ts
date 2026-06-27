import type { App } from "attio";
import { bulkResearchAction } from "./actions/bulk-research";
import { researchCandidateAction } from "./actions/research-candidate";
import { recruitingCopilotWidget } from "./record/recruiting-copilot-widget";
import "./app.settings";

export const app: App = {
  record: {
    actions: [researchCandidateAction],
    bulkActions: [bulkResearchAction],
    widgets: [recruitingCopilotWidget],
  },
  callRecording: {
    insight: { textActions: [] },
    summary: { textActions: [] },
    transcript: { textActions: [] },
  },
  settings: {},
};
