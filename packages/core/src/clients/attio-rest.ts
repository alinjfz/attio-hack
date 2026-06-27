import { readEnv } from "../config/env.js";

export interface AttioRestConfig {
  apiToken: string;
  baseUrl?: string;
  roleObjectSlug?: string;
}

export interface PersonContext {
  recordId: string;
  name: string;
  cvText: string;
  linkedinUrl?: string;
  roleRecordId?: string;
  roleDescription?: string;
  roleTitle?: string;
}

type AttioValue = {
  value?: string | number;
  target_record_id?: string;
  option?: string;
};

type AttioRecordResponse = {
  data?: {
    values?: Record<string, AttioValue[]>;
  };
};

function getBaseUrl(config: AttioRestConfig): string {
  return config.baseUrl ?? "https://api.attio.com/v2";
}

function getRoleObjectSlug(config: AttioRestConfig): string {
  return config.roleObjectSlug ?? readEnv("ATTIO_ROLE_OBJECT_SLUG") ?? "roles";
}

export function extractTextValue(
  values: Record<string, AttioValue[]> | undefined,
  slug: string,
): string | undefined {
  const entry = values?.[slug]?.[0];
  if (!entry) return undefined;
  if (typeof entry.value === "string") return entry.value;
  if (typeof entry.value === "number") return String(entry.value);
  return undefined;
}

export function extractRecordReference(
  values: Record<string, AttioValue[]> | undefined,
  slug: string,
): string | undefined {
  return values?.[slug]?.[0]?.target_record_id;
}

export async function getRecord(
  config: AttioRestConfig,
  objectSlug: string,
  recordId: string,
): Promise<AttioRecordResponse> {
  const response = await fetch(
    `${getBaseUrl(config)}/objects/${objectSlug}/records/${recordId}`,
    {
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    const body = await response.text();
    if (response.status === 403) {
      throw new Error(
        `Attio GET ${objectSlug} failed: 403 — API key needs Records read + Object Configuration read scopes (Workspace settings → Developers → your app → Scopes). ${body}`,
      );
    }
    throw new Error(`Attio GET ${objectSlug} failed: ${response.status} ${body}`);
  }

  return response.json() as Promise<AttioRecordResponse>;
}

export async function getPersonContext(
  config: AttioRestConfig,
  recordId: string,
): Promise<PersonContext> {
  const person = await getRecord(config, "people", recordId);
  const values = person.data?.values;
  const roleRecordId = extractRecordReference(values, "role");

  let roleDescription: string | undefined;
  let roleTitle: string | undefined;

  if (roleRecordId) {
    const role = await getRecord(config, getRoleObjectSlug(config), roleRecordId);
    roleDescription = extractTextValue(role.data?.values, "description");
    roleTitle = extractTextValue(role.data?.values, "title");
  }

  const name =
    extractTextValue(values, "name") ??
    extractTextValue(values, "full_name") ??
    "Candidate";

  return {
    recordId,
    name,
    cvText: extractTextValue(values, "cv_text") ?? "",
    linkedinUrl: extractTextValue(values, "linkedin_url"),
    roleRecordId,
    roleDescription,
    roleTitle,
  };
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
