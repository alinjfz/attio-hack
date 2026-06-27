export interface AttioRestConfig {
  apiToken: string;
  baseUrl?: string;
}

export interface PatchPersonValues {
  fitScore?: number;
  fitTier?: string;
  twoLiner?: string;
  cvText?: string;
}

export interface CreateNoteInput {
  recordId: string;
  title: string;
  content: string;
}

function getBaseUrl(config: AttioRestConfig): string {
  return config.baseUrl ?? "https://api.attio.com/v2";
}

export function buildPatchPersonPayload(values: PatchPersonValues): {
  data: { values: Record<string, Array<{ value?: number | string; option?: string }>> };
} {
  const attioValues: Record<string, Array<{ value?: number | string; option?: string }>> = {};

  if (values.fitScore !== undefined) {
    attioValues.fit_score = [{ value: values.fitScore }];
  }
  if (values.fitTier !== undefined) {
    attioValues.fit_tier = [{ option: values.fitTier.toLowerCase() }];
  }
  if (values.twoLiner !== undefined) {
    attioValues.two_liner = [{ value: values.twoLiner }];
  }
  if (values.cvText !== undefined) {
    attioValues.cv_text = [{ value: values.cvText }];
  }

  return { data: { values: attioValues } };
}

export function buildCreateNotePayload(input: CreateNoteInput): {
  data: {
    parent_object: string;
    parent_record_id: string;
    title: string;
    format: string;
    content: string;
  };
} {
  return {
    data: {
      parent_object: "people",
      parent_record_id: input.recordId,
      title: input.title,
      format: "markdown",
      content: input.content,
    },
  };
}

export async function patchPerson(
  config: AttioRestConfig,
  recordId: string,
  values: PatchPersonValues,
): Promise<void> {
  const response = await fetch(
    `${getBaseUrl(config)}/objects/people/records/${recordId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildPatchPersonPayload(values)),
    },
  );

  if (!response.ok) {
    throw new Error(`Attio PATCH failed: ${response.status} ${await response.text()}`);
  }
}

export async function createNote(
  config: AttioRestConfig,
  input: CreateNoteInput,
): Promise<void> {
  const response = await fetch(`${getBaseUrl(config)}/notes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildCreateNotePayload(input)),
  });

  if (!response.ok) {
    throw new Error(`Attio note creation failed: ${response.status} ${await response.text()}`);
  }
}

export function buildHmNoteContent(
  hmNote: string,
  pros: string[],
  cons: string[],
): string {
  const sections = [
    hmNote,
    "",
    "## Fit reasoning",
    "",
    "### Pros",
    ...pros.map((pro) => `- ${pro}`),
    "",
    "### Cons",
    ...cons.map((con) => `- ${con}`),
  ];

  return sections.join("\n");
}
