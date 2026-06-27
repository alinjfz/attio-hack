import type { App } from "attio";
import { bulkAudioSummaryAction } from "./actions/bulk-audio-summary";
import { bulkResearchAction } from "./actions/bulk-research";
import { playAudioSummaryAction } from "./actions/play-audio-summary";
import { researchCandidateAction } from "./actions/research-candidate";
import { audioSummaryWidget } from "./record/audio-summary";
import { recruitingCopilotWidget } from "./record/recruiting-copilot-widget";
import { workspaceSettings } from "./workspace-settings";
import "./app.settings";

export const app: App = {
  record: {
    actions: [researchCandidateAction, playAudioSummaryAction],
    bulkActions: [bulkResearchAction, bulkAudioSummaryAction],
    widgets: [recruitingCopilotWidget, audioSummaryWidget],
  },
  callRecording: {
    insight: { textActions: [] },
    summary: { textActions: [] },
    transcript: { textActions: [] },
  },
  settings: {
    workspace: workspaceSettings,
  },
};
