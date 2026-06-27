import { LoadingState, Typography } from "attio/client";
import { useEffect, useState } from "react";
import getAudioSummaryScript from "../server/get-audio-summary-script.server";
import { PlayAudioSummaryButton } from "./single-audio-dialog";

export function PersonAudioSummary({
  recordId,
  savedScript,
  storedScript,
}: {
  recordId: string;
  savedScript?: string | null;
  /** Audio script already loaded on the person record (e.g. from parent GraphQL query). */
  storedScript?: string | null;
}) {
  const [script, setScript] = useState("");
  const [resolving, setResolving] = useState(true);

  const graphqlScript = storedScript?.trim() ?? "";
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
