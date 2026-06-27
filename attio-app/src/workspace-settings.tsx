import type { App } from "attio";
import { useWorkspaceSettingsForm } from "attio/client";

export const workspaceSettings: App.Settings.Workspace = {
  Page,
};

function Page() {
  const { Form, Section, TextInput, Toggle } = useWorkspaceSettingsForm();

  return (
    <Form>
      <Section
        title="Required for Research"
        description="Copy values from your local .env into these fields. Research runs in Attio's cloud and cannot read your machine's .env file."
      >
        <TextInput
          label="Superlinked API key"
          name="superlinked_api_key"
          placeholder="SL-..."
        />
        <TextInput
          label="Superlinked cluster URL"
          name="superlinked_cluster_url"
          placeholder="https://..."
        />
        <TextInput
          label="Superlinked model"
          name="superlinked_model"
          placeholder="BAAI/bge-m3"
        />
        <TextInput
          label="Gemini API key"
          name="gemini_api_key"
          placeholder="AIza..."
        />
        <TextInput
          label="Gemini model"
          name="gemini_model"
          placeholder="gemini-2.5-flash"
        />
      </Section>

      <Section
        title="Optional integrations"
        description="Tavily adds web research bullets. SLNG enables the audio list summary widget."
      >
        <Toggle
          label="Enable Tavily web research"
          name="enable_tavily"
          description="Uses Tavily credits. Off by default."
        />
        <TextInput label="Tavily API key" name="tavily_api_key" placeholder="tvly-..." />
        <Toggle
          label="Enable SLNG audio summary"
          name="enable_slng"
          description="Requires an SLNG API key."
        />
        <TextInput label="SLNG API key" name="slng_api_key" placeholder="slng-..." />
        <TextInput
          label="SLNG TTS model"
          name="slng_tts_model"
          placeholder="slng/deepgram/aura:2-en"
        />
        <TextInput
          label="SLNG TTS voice"
          name="slng_tts_voice"
          placeholder="aura-2-thalia-en"
        />
      </Section>
    </Form>
  );
}
