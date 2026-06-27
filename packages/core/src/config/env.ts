type EnvRecord = Record<string, string | undefined>;

function envRecord(): EnvRecord | undefined {
  return (globalThis as { process?: { env?: EnvRecord } }).process?.env;
}

export function readEnv(name: string): string | undefined {
  const value = envRecord()?.[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function readEnvFlag(name: string): boolean {
  const value = readEnv(name)?.toLowerCase();
  return value === "true" || value === "1" || value === "yes";
}
