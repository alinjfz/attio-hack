import type { SIEClient } from "@superlinked/sie-sdk";

export interface SIEClientConfig {
  clusterUrl: string;
  apiKey: string;
  model?: string;
}

export interface EncodeResult {
  dense: Float32Array;
}

export interface SIEClientLike {
  encode(
    model: string,
    input: { text: string },
    options?: { isQuery?: boolean },
  ): Promise<{ dense?: Float32Array }>;
}

export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length || a.length === 0) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) {
    return 0;
  }

  return dot / denominator;
}

export async function createSIEClient(config: SIEClientConfig): Promise<SIEClient> {
  const { SIEClient } = await import("@superlinked/sie-sdk");
  return new SIEClient(config.clusterUrl, {
    apiKey: config.apiKey,
    waitForCapacity: true,
    provisionTimeout: 420_000,
    timeout: 60_000,
  });
}

export async function encodeText(
  client: SIEClientLike,
  model: string,
  text: string,
  options?: { isQuery?: boolean },
): Promise<EncodeResult> {
  const result = await client.encode(model, { text }, options);
  if (!result.dense) {
    throw new Error("SIE encode returned no dense embedding");
  }
  return { dense: result.dense };
}
