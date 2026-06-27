import type { DraftBundle } from "@recruiting-copilot/core/schemas/draft-bundle";
import type { FitResult } from "@recruiting-copilot/core/schemas/fit-result";
import { Section, TextBlock } from "attio/client";
import { formatBulletSection } from "./format-bullets";
import { DraftTextBlock } from "./format-prose";
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
        <DraftTextBlock text={bundle.twoLiner || "No summary yet."} />
      </Section>
      <Section title="Pros / cons">
        <TextBlock>
          {formatBulletSection("Pros", bundle.fitReasoning.pros, "No pros listed.")}
          {"\n\n"}
          {formatBulletSection("Cons", bundle.fitReasoning.cons, "No cons listed.")}
        </TextBlock>
      </Section>
      <Section title="Submittal preview">
        <DraftTextBlock text={bundle.clientSubmittalDraft || "No submittal draft."} />
      </Section>
    </>
  );
}
