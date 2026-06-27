import { Settings, type SettingsSchema } from "attio";

const appSettingsSchema = {
  workspace: {
    gemini_api_key: Settings.string(),
    superlinked_api_key: Settings.string(),
    superlinked_cluster_url: Settings.string(),
    superlinked_model: Settings.string(),
    gemini_model: Settings.string(),
    enable_tavily: Settings.boolean(),
    tavily_api_key: Settings.string(),
    enable_slng: Settings.boolean(),
    slng_api_key: Settings.string(),
    slng_tts_model: Settings.string(),
    slng_tts_voice: Settings.string(),
  },
} satisfies SettingsSchema;

export default appSettingsSchema;
