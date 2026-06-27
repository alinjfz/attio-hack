import type { DraftBundle } from "@recruiting-copilot/core/schemas/draft-bundle";
import type { FitResult } from "@recruiting-copilot/core/schemas/fit-result";
import { Section, TextBlock } from "attio/client";
import { DraftTextBlock } from "./format-prose";
import { TierBadge } from "./tier-badge";

export function BundlePreview({
  fit,
  bundle,
}: {
  fit: FitResult;
  bundle: DraftBundle;
}) {
  const prosLines = bundle.fitReasoning.pros.map((pro) => `+ ${pro}`).join("\n");
  const consLines = bundle.fitReasoning.cons.map((con) => `- ${con}`).join("\n");

  return (
    <>
      <Section title="Fit">
        <TierBadge tier={fit.tier} score={fit.score} />
        <DraftTextBlock text={bundle.twoLiner || "No summary yet."} />
      </Section>
      <Section title="Pros / cons">
        <TextBlock>
          {prosLines}
          {prosLines && consLines ? "\n\n" : ""}
          {consLines || "No pros or cons listed."}
        </TextBlock>
      </Section>
      <Section title="Submittal preview">
        <DraftTextBlock text={bundle.clientSubmittalDraft || "No submittal draft."} />
      </Section>
    </>
  );
}
