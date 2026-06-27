import { getWorkspaceConnection, getWorkspaceSettings } from "attio/server";
import { readEnv, readEnvFlag } from "@recruiting-copilot/core/config/env";

const CONNECTION_KEYS: Record<string, string> = {
  GEMINI_API_KEY: "gemini_api_key",
  SUPERLINKED_API_KEY: "superlinked_api_key",
  SUPERLINKED_CLUSTER_URL: "superlinked_cluster_url",
  SUPERLINKED_MODEL: "superlinked_model",
  GEMINI_MODEL: "gemini_model",
  TAVILY_API_KEY: "tavily_api_key",
  ENABLE_TAVILY: "enable_tavily",
  SLNG_API_KEY: "slng_api_key",
  ENABLE_SLNG: "enable_slng",
};

const SETTINGS_KEYS: Record<string, keyof Awaited<ReturnType<typeof getWorkspaceSettings>>> = {
  GEMINI_API_KEY: "gemini_api_key",
  SUPERLINKED_API_KEY: "superlinked_api_key",
  SUPERLINKED_CLUSTER_URL: "superlinked_cluster_url",
  SUPERLINKED_MODEL: "superlinked_model",
  GEMINI_MODEL: "gemini_model",
  TAVILY_API_KEY: "tavily_api_key",
  SLNG_API_KEY: "slng_api_key",
};

let settingsPromise: ReturnType<typeof getWorkspaceSettings> | undefined;

function workspaceSettings() {
  if (!settingsPromise) {
    settingsPromise = getWorkspaceSettings();
  }
  return settingsPromise;
}

function normalize(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return undefined;
}

export async function readRuntimeEnv(name: string): Promise<string | undefined> {
  const fromEnv = readEnv(name);
  if (fromEnv) {
    return fromEnv;
  }

  try {
    const settings = await workspaceSettings();
    const settingsKey = SETTINGS_KEYS[name];
    if (settingsKey) {
      const fromSettings = normalize(settings[settingsKey]);
      if (fromSettings) {
        return fromSettings;
      }
    }
  } catch {
    // Workspace settings are optional until configured in the app UI.
  }

  const connectionKey = CONNECTION_KEYS[name];
  if (!connectionKey) {
    return undefined;
  }

  try {
    const value = getWorkspaceConnection(connectionKey).value.trim();
    return value || undefined;
  } catch {
    return undefined;
  }
}

export async function readRuntimeEnvFlag(name: string): Promise<boolean> {
  if (readEnvFlag(name)) {
    return true;
  }

  if (name === "ENABLE_TAVILY") {
    try {
      const settings = await workspaceSettings();
      if (settings.enable_tavily === true) {
        return true;
      }
    } catch {
      // ignore
    }
  }

  if (name === "ENABLE_SLNG") {
    try {
      const settings = await workspaceSettings();
      if (settings.enable_slng === true) {
        return true;
      }
    } catch {
      // ignore
    }
  }

  const value = await readRuntimeEnv(name);
  if (!value) {
    return false;
  }
  const normalized = value.toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}
