import { describe, expect, it } from "vitest";
import app from "./index.js";

describe("api webhook", () => {
  it("GET /health returns ok", async () => {
    const response = await app.request("/health");
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
  });

  it("POST /webhook/research rejects missing auth", async () => {
    const response = await app.request("/webhook/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roleDescription: "Engineer",
        cvText: "CV",
        candidateName: "Alex",
      }),
    });

    expect(response.status).toBe(401);
  });
});
