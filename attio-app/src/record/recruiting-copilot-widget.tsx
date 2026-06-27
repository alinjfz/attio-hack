import type { App } from "attio";
import { Section, Typography } from "attio/client";

export const recruitingCopilotWidget: App.Record.Widget = {
  id: "recruiting-copilot",
  label: "Recruiting Copilot",
  objects: ["people"],
  Widget: () => {
    return (
      <Section title="Recruiting Copilot">
        <Typography.Body>
          Research candidates, score fit against linked roles, and approve drafts before
          anything writes to Attio.
        </Typography.Body>
        <Typography.Body>
          Placeholder widget — full research flow ships in Phase 2.
        </Typography.Body>
      </Section>
    );
  },
};
