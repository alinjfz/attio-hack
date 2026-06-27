import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { shouldEnrich } from "../clients/tavily.js";

describe("shouldEnrich", () => {
  const original = process.env.ENABLE_TAVILY;

  beforeEach(() => {
    process.env.ENABLE_TAVILY = "true";
    process.env.TAVILY_API_KEY = "tvly-test-key";
  });

  afterEach(() => {
    process.env.ENABLE_TAVILY = original;
  });

  it("returns true for thin CV", () => {
    expect(shouldEnrich("short cv", undefined)).toBe(true);
  });

  it("returns true when LinkedIn present and CV under 1500 chars", () => {
    const cv = "x".repeat(1000);
    expect(shouldEnrich(cv, "https://linkedin.com/in/alex")).toBe(true);
  });

  it("returns false when flag on but API key missing", () => {
    process.env.ENABLE_TAVILY = "true";
    process.env.TAVILY_API_KEY = "  ";
    expect(shouldEnrich("short", undefined)).toBe(false);
  });

  it("returns false when feature flag disabled", () => {
    process.env.ENABLE_TAVILY = "false";
    expect(shouldEnrich("short", "https://linkedin.com/in/alex")).toBe(false);
  });

  it("returns false for rich CV without LinkedIn", () => {
    const cv = "x".repeat(2000);
    expect(shouldEnrich(cv, undefined)).toBe(false);
  });
});
