import type { DraftBundle } from "@recruiting-copilot/core/schemas/draft-bundle";
import type { FitResult } from "@recruiting-copilot/core/schemas/fit-result";
import { Section, TextBlock } from "attio/client";
import { displayBlocks, displayBulletBlocks } from "./display-blocks";
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
        {displayBlocks(bundle.twoLiner || "No summary yet.", "two-liner")}
      </Section>
      <Section title="Pros / cons">
        <TextBlock align="left">Pros</TextBlock>
        {displayBulletBlocks(bundle.fitReasoning.pros, "preview-pro", "No pros listed.")}
        <TextBlock align="left">Cons</TextBlock>
        {displayBulletBlocks(bundle.fitReasoning.cons, "preview-con", "No cons listed.")}
      </Section>
      <Section title="Submittal preview">
        {displayBlocks(bundle.clientSubmittalDraft || "No submittal draft.", "preview-submittal")}
      </Section>
    </>
  );
}
