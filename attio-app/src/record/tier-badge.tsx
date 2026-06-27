import { Badge } from "attio/client";
import type { FitTier } from "@recruiting-copilot/core";

const TIER_COLORS: Record<
  FitTier,
  React.ComponentProps<typeof Badge>["color"]
> = {
  Strong: "green",
  Good: "blue",
  Weak: "amber",
  Unknown: "grey",
};

export function TierBadge({ tier, score }: { tier: FitTier; score?: number }) {
  const label = score !== undefined ? `${score}% · ${tier}` : tier;
  return <Badge color={TIER_COLORS[tier]}>{label}</Badge>;
}
