import { describe, expect, it } from "vitest";
import { cleanTtsScript, splitScriptForTts } from "./split-tts-script.js";

describe("splitScriptForTts", () => {
  it("strips generic profile-review filler", () => {
    const cleaned = cleanTtsScript(
      "Reviewing Candidate's profile reveals a truly good fit for our team. Cruz Jacobs scores 54 percent.",
    );
    expect(cleaned).not.toContain("Reviewing Candidate");
    expect(cleaned).toContain("Cruz Jacobs");
  });

  it("returns a single chunk for short scripts", () => {
    expect(splitScriptForTts("Cruz Jacobs scores 54 percent.")).toEqual([
      "Cruz Jacobs scores 54 percent.",
    ]);
  });

  it("splits long scripts on sentence boundaries", () => {
    const long = [
      "Cruz Jacobs is a backend engineer with six years of Java experience.",
      "Cruz is also building React side projects.",
      "Devon Spinka leads frontend work with strong TypeScript skills.",
    ].join(" ");

    const chunks = splitScriptForTts(long, 80);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join(" ")).toContain("Cruz Jacobs");
    expect(chunks.join(" ")).toContain("Devon Spinka");
  });
});
