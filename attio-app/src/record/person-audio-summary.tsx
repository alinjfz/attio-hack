import { LoadingState, Typography, useQuery } from "attio/client";
import { useEffect, useState } from "react";
import getCandidateContext from "../graphql/get-candidate-context.graphql";
import getAudioSummaryScript from "../server/get-audio-summary-script.server";
import { PlayAudioSummaryButton } from "./single-audio-dialog";

function readText(
  value?: { __typename?: string; value?: string | null } | null,
): string {
  return value?.__typename === "TextValue" ? (value.value ?? "") : "";
}

export function PersonAudioSummary({
  recordId,
  savedScript,
}: {
  recordId: string;
  savedScript?: string | null;
}) {
  const { person } = useQuery(getCandidateContext, { recordId });
  const [script, setScript] = useState("");
  const [resolving, setResolving] = useState(true);

  const graphqlScript = readText(person?.audio_summary_script);
  const overrideScript = savedScript?.trim() ?? "";

  useEffect(() => {
    let cancelled = false;

    async function resolveScript() {
      if (overrideScript) {
        setScript(overrideScript);
        setResolving(false);
        return;
      }

      if (graphqlScript.trim()) {
        setScript(graphqlScript.trim());
        setResolving(false);
        return;
      }

      try {
        const fromRecord = await getAudioSummaryScript(recordId);
        if (!cancelled) {
          setScript(fromRecord?.trim() ?? "");
        }
      } catch {
        if (!cancelled) {
          setScript("");
        }
      } finally {
        if (!cancelled) {
          setResolving(false);
        }
      }
    }

    setResolving(true);
    void resolveScript();

    return () => {
      cancelled = true;
    };
  }, [graphqlScript, overrideScript, recordId]);

  if (resolving) {
    return <LoadingState />;
  }

  if (!script) {
    return (
      <Typography.Body>
        No audio summary yet. Approve research with Create a summary with SLNG to save a
        script to notes and enable playback here.
      </Typography.Body>
    );
  }

  return <PlayAudioSummaryButton script={script} />;
}
