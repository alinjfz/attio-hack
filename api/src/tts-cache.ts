import { randomUUID } from "node:crypto";

interface CacheEntry {
  buffer: Buffer;
  contentType: string;
  expiresAt: number;
}

const TTL_MS = 60 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

function purgeExpired(now = Date.now()): void {
  for (const [id, entry] of cache) {
    if (entry.expiresAt <= now) {
      cache.delete(id);
    }
  }
}

export function storeAudio(buffer: ArrayBuffer, contentType: string): string {
  purgeExpired();
  const id = randomUUID();
  cache.set(id, {
    buffer: Buffer.from(buffer),
    contentType,
    expiresAt: Date.now() + TTL_MS,
  });
  return id;
}

export function getAudio(id: string): CacheEntry | undefined {
  purgeExpired();
  const entry = cache.get(id);
  if (!entry) {
    return undefined;
  }
  if (entry.expiresAt <= Date.now()) {
    cache.delete(id);
    return undefined;
  }
  return entry;
}

export function clearTtsCache(): void {
  cache.clear();
}
