import type { SIEClient } from "@superlinked/sie-sdk";

export interface SIEClientConfig {
  clusterUrl: string;
  apiKey: string;
  model?: string;
}

export interface FetchSIEClientOptions extends SIEClientConfig {
  /** Per-request timeout in ms. Keep under Attio's 30s server-function limit. */
  timeout?: number;
  waitForCapacity?: boolean;
  provisionTimeout?: number;
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
  encodeBatch?(
    model: string,
    inputs: { text: string }[],
    options?: { isQuery?: boolean },
  ): Promise<Array<{ dense?: Float32Array }>>;
}

interface JsonDenseVector {
  values?: number[];
}

interface JsonEncodeResponse {
  items?: Array<{ dense?: JsonDenseVector }>;
}

function normalizeBaseUrl(clusterUrl: string): string {
  return clusterUrl.replace(/\/$/, "");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(response: Response): number {
  const header = response.headers.get("Retry-After");
  if (!header) {
    return 5_000;
  }
  const seconds = Number.parseInt(header, 10);
  if (!Number.isNaN(seconds)) {
    return seconds * 1_000;
  }
  const dateMs = Date.parse(header);
  if (!Number.isNaN(dateMs)) {
    return Math.max(0, dateMs - Date.now());
  }
  return 5_000;
}

/**
 * JSON/fetch SIE client for constrained runtimes (e.g. Attio server functions).
 * The official SDK uses msgpack, which calls TextEncoder.encodeInto — unavailable in Attio's sandbox.
 */
export function createFetchSIEClient(config: FetchSIEClientOptions): SIEClientLike {
  const baseUrl = normalizeBaseUrl(config.clusterUrl);
  const timeout = config.timeout ?? 25_000;
  const waitForCapacity = config.waitForCapacity ?? true;
  const provisionTimeout = config.provisionTimeout ?? 25_000;

  return {
    async encode(model, input, options) {
      const body: Record<string, unknown> = {
        items: [input],
      };

      if (options?.isQuery !== undefined) {
        body.params = { is_query: options.isQuery };
      }

      const url = `${baseUrl}/v1/encode/${encodeURIComponent(model)}`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      if (config.apiKey) {
        headers.Authorization = `Bearer ${config.apiKey}`;
      }

      const startTime = Date.now();

      while (true) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        let response: Response;
        try {
          response = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
            signal: controller.signal,
          });
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            throw new Error(`Superlinked request timed out after ${timeout}ms`);
          }
          throw error;
        } finally {
          clearTimeout(timeoutId);
        }

        if (response.status === 202) {
          if (!waitForCapacity) {
            throw new Error("Superlinked cluster has no capacity. Try again in a few minutes.");
          }
          const elapsed = Date.now() - startTime;
          if (elapsed >= provisionTimeout) {
            throw new Error(
              `Superlinked cluster is still warming up. Pre-warm with "pnpm research:smoke", then retry.`,
            );
          }
          const delay = Math.min(parseRetryAfterMs(response), provisionTimeout - elapsed);
          await sleep(delay);
          continue;
        }

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Superlinked encode failed (${response.status}): ${text.slice(0, 200)}`);
        }

        const data = (await response.json()) as JsonEncodeResponse;
        const values = data.items?.[0]?.dense?.values;
        if (!values?.length) {
          throw new Error("SIE encode returned no dense embedding");
        }

        return { dense: Float32Array.from(values) };
      }
    },

    async encodeBatch(model, inputs, options) {
      if (inputs.length === 0) {
        return [];
      }

      const body: Record<string, unknown> = {
        items: inputs,
      };

      if (options?.isQuery !== undefined) {
        body.params = { is_query: options.isQuery };
      }

      const url = `${baseUrl}/v1/encode/${encodeURIComponent(model)}`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      if (config.apiKey) {
        headers.Authorization = `Bearer ${config.apiKey}`;
      }

      const startTime = Date.now();

      while (true) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        let response: Response;
        try {
          response = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
            signal: controller.signal,
          });
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            throw new Error(`Superlinked request timed out after ${timeout}ms`);
          }
          throw error;
        } finally {
          clearTimeout(timeoutId);
        }

        if (response.status === 202) {
          if (!waitForCapacity) {
            throw new Error("Superlinked cluster has no capacity. Try again in a few minutes.");
          }
          const elapsed = Date.now() - startTime;
          if (elapsed >= provisionTimeout) {
            throw new Error(
              `Superlinked cluster is still warming up. Pre-warm with "pnpm research:smoke", then retry.`,
            );
          }
          const delay = Math.min(parseRetryAfterMs(response), provisionTimeout - elapsed);
          await sleep(delay);
          continue;
        }

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Superlinked encode failed (${response.status}): ${text.slice(0, 200)}`);
        }

        const data = (await response.json()) as JsonEncodeResponse;
        const items = data.items ?? [];
        if (items.length !== inputs.length) {
          throw new Error("SIE batch encode returned unexpected item count");
        }

        return items.map((item) => {
          const batchValues = item.dense?.values;
          if (!batchValues?.length) {
            throw new Error("SIE batch encode returned no dense embedding");
          }
          return { dense: Float32Array.from(batchValues) };
        });
      }
    },
  };
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

export async function encodeTexts(
  client: SIEClientLike,
  model: string,
  texts: string[],
  options?: { isQuery?: boolean },
): Promise<EncodeResult[]> {
  if (texts.length === 0) {
    return [];
  }

  if (client.encodeBatch) {
    const results = await client.encodeBatch(
      model,
      texts.map((text) => ({ text })),
      options,
    );
    return results.map((result) => {
      if (!result.dense) {
        throw new Error("SIE encode returned no dense embedding");
      }
      return { dense: result.dense };
    });
  }

  return Promise.all(texts.map((text) => encodeText(client, model, text, options)));
}
