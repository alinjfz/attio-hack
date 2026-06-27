import type { DraftBundle } from "@recruiting-copilot/core/schemas/draft-bundle";
import type { FitResult } from "@recruiting-copilot/core/schemas/fit-result";
import { Section, Typography } from "attio/client";
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
        <Typography.Body>{bundle.twoLiner}</Typography.Body>
      </Section>
      <Section title="Pros / cons">
        {bundle.fitReasoning.pros.map((pro) => (
          <Typography.Body key={pro}>+ {pro}</Typography.Body>
        ))}
        {bundle.fitReasoning.cons.map((con) => (
          <Typography.Body key={con}>- {con}</Typography.Body>
        ))}
      </Section>
      <Section title="Submittal preview">
        <Typography.Body>{bundle.clientSubmittalDraft.slice(0, 280)}…</Typography.Body>
      </Section>
    </>
  );
}
