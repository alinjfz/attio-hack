import { describe, expect, it } from "vitest";
import { formatAudioHostingError } from "./audio-hosting-errors.js";

describe("formatAudioHostingError", () => {
  it("explains Cloudflare 530 tunnel offline", () => {
    const message = formatAudioHostingError(
      530,
      "<!doctype html> Cloudflare Tunnel error",
      "https://old.trycloudflare.com",
    );
    expect(message).toContain("tunnel is offline");
    expect(message).toContain("api:public");
  });

  it("explains webhook auth failure", () => {
    expect(formatAudioHostingError(401, '{"error":"Unauthorized"}', "https://x.com")).toContain(
      "Webhook secret",
    );
  });
});
