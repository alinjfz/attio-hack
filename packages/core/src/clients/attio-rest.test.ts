import { describe, expect, it } from "vitest";
import {
  buildCreateNotePayload,
  buildHmNoteContent,
  buildPatchPersonPayload,
  extractRecordReference,
  extractTextValue,
} from "./attio-rest.js";

describe("attio-rest payload builders", () => {
  it("builds PATCH payload for fit fields", () => {
    const payload = buildPatchPersonPayload({
      fitScore: 82,
      fitTier: "Strong",
      twoLiner: "Strong TypeScript engineer.",
    });

    expect(payload.data.values.fit_score).toEqual([{ value: 82 }]);
    expect(payload.data.values.fit_tier).toEqual([{ option: "strong" }]);
    expect(payload.data.values.two_liner).toEqual([
      { value: "Strong TypeScript engineer." },
    ]);
  });

  it("builds note payload with markdown content", () => {
    const payload = buildCreateNotePayload({
      recordId: "rec_123",
      title: "HM Internal Note",
      content: "## Summary\nStrong candidate",
    });

    expect(payload.data.parent_record_id).toBe("rec_123");
    expect(payload.data.format).toBe("markdown");
  });

  it("combines HM note with pros and cons", () => {
    const content = buildHmNoteContent("Great fit.", ["TypeScript"], ["No Attio"]);
    expect(content).toContain("Great fit.");
    expect(content).toContain("- TypeScript");
    expect(content).toContain("- No Attio");
  });

  it("extracts text and record reference values", () => {
    const values = {
      cv_text: [{ value: "Engineer CV" }],
      role: [{ target_record_id: "role_123" }],
    };

    expect(extractTextValue(values, "cv_text")).toBe("Engineer CV");
    expect(extractRecordReference(values, "role")).toBe("role_123");
  });
});
