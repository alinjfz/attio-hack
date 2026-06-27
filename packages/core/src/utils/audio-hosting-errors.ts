export function formatAudioHostingError(
  status: number,
  body: string,
  baseUrl: string,
): string {
  const tunnelOffline =
    status === 530 ||
    status === 502 ||
    status === 503 ||
    body.includes("Cloudflare Tunnel error") ||
    body.includes("trycloudflare.com");

  if (tunnelOffline) {
    return [
      "Your public API tunnel is offline or the URL in Attio settings is stale.",
      "Fix: run `pnpm api:public` in a terminal, copy the new trycloudflare.com URL into Attio → App settings → api_public_url, and keep that terminal open.",
      `Current URL: ${baseUrl}`,
    ].join(" ");
  }

  if (status === 401) {
    return "Webhook secret mismatch. Set webhook_secret in Attio app settings to match WEBHOOK_SECRET in your .env exactly.";
  }

  const snippet = body.trim().slice(0, 180);
  return snippet
    ? `Audio hosting failed (${status}): ${snippet}`
    : `Audio hosting failed (${status}). Check that pnpm api:public is running.`;
}

export async function assertPublicApiReachable(baseUrl: string): Promise<void> {
  try {
    const response = await fetch(`${baseUrl}/health`);
    if (!response.ok) {
      throw new Error(formatAudioHostingError(response.status, await response.text(), baseUrl));
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("public API tunnel")) {
      throw error;
    }
    throw new Error(
      [
        `Cannot reach ${baseUrl}/health.`,
        "Run `pnpm api:public`, paste the printed URL into Attio app settings → api_public_url, and keep the terminal open.",
      ].join(" "),
    );
  }
}
