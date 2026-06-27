import type { DraftBundle } from "@recruiting-copilot/core/schemas/draft-bundle";
import type { FitResult } from "@recruiting-copilot/core/schemas/fit-result";
import { Section, TextBlock } from "attio/client";
import { TierBadge } from "./tier-badge";

export function BundlePreview({
  fit,
  bundle,
}: {
  fit: FitResult;
  bundle: DraftBundle;
}) {
  return (
    <>
      <Section title="Fit">
        <TierBadge tier={fit.tier} score={fit.score} />
        <TextBlock>{bundle.twoLiner || "No summary yet."}</TextBlock>
      </Section>
      <Section title="Pros / cons">
        <TextBlock>
          {bundle.fitReasoning.pros.map((pro) => `+ ${pro}`).join("\n")}
          {bundle.fitReasoning.pros.length > 0 && bundle.fitReasoning.cons.length > 0 ? "\n" : ""}
          {bundle.fitReasoning.cons.map((con) => `- ${con}`).join("\n")}
        </TextBlock>
      </Section>
      <Section title="Submittal preview">
        <TextBlock>
          {bundle.clientSubmittalDraft
            ? `${bundle.clientSubmittalDraft.slice(0, 280)}…`
            : "No submittal draft."}
        </TextBlock>
      </Section>
    </>
  );
}
