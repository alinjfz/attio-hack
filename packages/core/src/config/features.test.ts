import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { isSlngEnabled, isTavilyEnabled } from "./features.js";

describe("feature flags", () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
  });

  describe("isTavilyEnabled", () => {
    it("is false by default", () => {
      delete process.env.ENABLE_TAVILY;
      delete process.env.TAVILY_API_KEY;
      expect(isTavilyEnabled()).toBe(false);
    });

    it("is false when flag true but no API key", () => {
      process.env.ENABLE_TAVILY = "true";
      process.env.TAVILY_API_KEY = "";
      expect(isTavilyEnabled()).toBe(false);
    });

    it("is true only when flag and key are set", () => {
      process.env.ENABLE_TAVILY = "true";
      process.env.TAVILY_API_KEY = "tvly-test";
      expect(isTavilyEnabled()).toBe(true);
    });

    it("accepts yes/1 as enabled", () => {
      process.env.ENABLE_TAVILY = "yes";
      process.env.TAVILY_API_KEY = "tvly-test";
      expect(isTavilyEnabled()).toBe(true);
    });
  });

  describe("isSlngEnabled", () => {
    it("is false unless explicitly enabled with key", () => {
      process.env.ENABLE_SLNG = "false";
      process.env.SLNG_API_KEY = "sk-test";
      expect(isSlngEnabled()).toBe(false);
    });
  });
});
