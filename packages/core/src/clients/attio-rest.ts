import { readEnv } from "../config/env.js";
import type { FitTier } from "../schemas/fit-result.js";
import { formatDraftForNote } from "../utils/format-prose.js";

export const FIT_TIER_OPTION_TITLES: readonly FitTier[] = [
  "Strong",
  "Good",
  "Weak",
  "Unknown",
];

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
  option?: string | { title?: string; id?: string };
  first_name?: string;
  last_name?: string;
  full_name?: string;
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

export function extractNumberValue(
  values: Record<string, AttioValue[]> | undefined,
  slug: string,
): number | undefined {
  const entry = values?.[slug]?.[0];
  if (typeof entry?.value === "number") {
    return entry.value;
  }
  if (typeof entry?.value === "string") {
    const parsed = Number(entry.value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function extractSelectOption(
  values: Record<string, AttioValue[]> | undefined,
  slug: string,
): string | undefined {
  const option = values?.[slug]?.[0]?.option;
  if (typeof option === "string") {
    return option;
  }
  if (option && typeof option === "object" && typeof option.title === "string") {
    return option.title;
  }
  return undefined;
}

export function extractPersonName(
  values: Record<string, AttioValue[]> | undefined,
): string {
  const nameEntry = values?.name?.[0];
  if (nameEntry?.full_name) {
    return nameEntry.full_name;
  }
  const parts = [nameEntry?.first_name, nameEntry?.last_name].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(" ");
  }
  return extractTextValue(values, "full_name") ?? "Candidate";
}

export interface PersonAudioSummary {
  recordId: string;
  name: string;
  fitScore: number;
  fitTier: string;
  twoLiner?: string;
}

export async function getPersonAudioSummaryScript(
  config: AttioRestConfig,
  recordId: string,
): Promise<string | undefined> {
  const person = await getRecord(config, "people", recordId);
  const script = extractTextValue(person.data?.values, "audio_summary_script")?.trim();
  return script || undefined;
}

export async function getPersonAudioSummary(
  config: AttioRestConfig,
  recordId: string,
): Promise<PersonAudioSummary | null> {
  const person = await getRecord(config, "people", recordId);
  const values = person.data?.values;
  const fitScore = extractNumberValue(values, "fit_score");
  const fitTier = extractSelectOption(values, "fit_tier");

  if (fitScore === undefined || !fitTier) {
    return null;
  }

  return {
    recordId,
    name: extractPersonName(values),
    fitScore,
    fitTier,
    twoLiner: extractTextValue(values, "two_liner"),
  };
}

type AttioListSummary = {
  id?: { list_id?: string };
  api_slug?: string;
  name?: string;
};

type AttioListEntry = {
  parent_record_id?: string;
};

export async function listRecruitingListRecordIds(
  config: AttioRestConfig,
  listSlug = "recruiting",
): Promise<string[]> {
  const listsResponse = await fetch(`${getBaseUrl(config)}/lists`, {
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!listsResponse.ok) {
    throw new Error(
      `Attio list lookup failed: ${listsResponse.status} ${await listsResponse.text()}`,
    );
  }

  const listsBody = (await listsResponse.json()) as { data?: AttioListSummary[] };
  const recruitingList = (listsBody.data ?? []).find(
    (list) =>
      list.api_slug === listSlug ||
      list.name?.toLowerCase().includes("recruit"),
  );

  const listId = recruitingList?.id?.list_id;
  if (!listId) {
    throw new Error(`Recruiting list "${listSlug}" was not found in this workspace.`);
  }

  const entriesResponse = await fetch(`${getBaseUrl(config)}/lists/${listId}/entries/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ limit: 100 }),
  });

  if (!entriesResponse.ok) {
    throw new Error(
      `Attio list entries query failed: ${entriesResponse.status} ${await entriesResponse.text()}`,
    );
  }

  const entriesBody = (await entriesResponse.json()) as { data?: AttioListEntry[] };
  return (entriesBody.data ?? [])
    .map((entry) => entry.parent_record_id)
    .filter((recordId): recordId is string => Boolean(recordId));
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

  const name = extractPersonName(values);

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
  audioSummaryScript?: string;
}

export interface CreateNoteInput {
  recordId: string;
  title: string;
  content: string;
}

type SelectOption = {
  title?: string;
};

async function attioRequest<T>(
  config: AttioRestConfig,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ ok: boolean; status: number; data: T; text: string }> {
  const response = await fetch(`${getBaseUrl(config)}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data = {} as T;
  if (text) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      data = {} as T;
    }
  }

  return { ok: response.ok, status: response.status, data, text };
}

export async function listSelectOptions(
  config: AttioRestConfig,
  objectSlug: string,
  attributeSlug: string,
): Promise<SelectOption[]> {
  const response = await attioRequest<{ data?: SelectOption[] }>(
    config,
    "GET",
    `/objects/${objectSlug}/attributes/${attributeSlug}/options`,
  );

  if (!response.ok) {
    throw new Error(
      `Attio list select options failed: ${response.status} ${response.text}`,
    );
  }

  return response.data.data ?? [];
}

export async function createSelectOption(
  config: AttioRestConfig,
  objectSlug: string,
  attributeSlug: string,
  title: string,
): Promise<void> {
  const response = await attioRequest(
    config,
    "POST",
    `/objects/${objectSlug}/attributes/${attributeSlug}/options`,
    { data: { title } },
  );

  if (!response.ok && response.status !== 409) {
    throw new Error(
      `Attio create select option "${title}" failed: ${response.status} ${response.text}`,
    );
  }
}

export function resolveFitTierOptionTitle(
  tier: string,
  availableTitles: string[],
): string {
  const match = availableTitles.find(
    (title) => title.toLowerCase() === tier.toLowerCase(),
  );
  if (match) {
    return match;
  }

  throw new Error(
    `No fit_tier option matches "${tier}". Available options: ${availableTitles.join(", ") || "(none)"}`,
  );
}

export async function ensureFitTierSelectOptions(
  config: AttioRestConfig,
): Promise<string[]> {
  const existing = await listSelectOptions(config, "people", "fit_tier");
  const knownTitles = new Set(
    existing.map((option) => option.title?.toLowerCase()).filter(Boolean),
  );

  for (const title of FIT_TIER_OPTION_TITLES) {
    if (!knownTitles.has(title.toLowerCase())) {
      try {
        await createSelectOption(config, "people", "fit_tier", title);
        knownTitles.add(title.toLowerCase());
      } catch (error) {
        throw new Error(
          `fit_tier select options are missing in Attio. Add ${FIT_TIER_OPTION_TITLES.join(", ")} under People → Fit tier, grant object_configuration:read-write to the app token, or run "pnpm seed:attio". ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  const refreshed = await listSelectOptions(config, "people", "fit_tier");
  const titles = refreshed
    .map((option) => option.title)
    .filter((title): title is string => Boolean(title));

  if (titles.length === 0) {
    throw new Error(
      `fit_tier has no select options in Attio. Add ${FIT_TIER_OPTION_TITLES.join(", ")} under People → Fit tier, or run "pnpm seed:attio".`,
    );
  }

  return titles;
}

export function buildPatchPersonPayload(values: PatchPersonValues): {
  data: { values: Record<string, Array<{ value?: number | string; option?: string }>> };
} {
  const attioValues: Record<string, Array<{ value?: number | string; option?: string }>> = {};

  if (values.fitScore !== undefined) {
    attioValues.fit_score = [{ value: values.fitScore }];
  }
  if (values.fitTier !== undefined) {
    attioValues.fit_tier = [{ option: values.fitTier }];
  }
  if (values.twoLiner !== undefined) {
    attioValues.two_liner = [{ value: values.twoLiner }];
  }
  if (values.cvText !== undefined) {
    attioValues.cv_text = [{ value: values.cvText }];
  }
  if (values.audioSummaryScript !== undefined) {
    attioValues.audio_summary_script = [{ value: values.audioSummaryScript }];
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
  let fitTier = values.fitTier;
  if (fitTier !== undefined) {
    const availableTitles = await ensureFitTierSelectOptions(config);
    fitTier = resolveFitTierOptionTitle(fitTier, availableTitles);
  }

  const response = await fetch(
    `${getBaseUrl(config)}/objects/people/records/${recordId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        buildPatchPersonPayload({
          ...values,
          fitTier,
        }),
      ),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    if (body.includes("value_not_found") && body.includes("select option")) {
      throw new Error(
        `Attio PATCH failed: fit_tier select options are missing or misnamed. Ensure People → Fit tier has options ${FIT_TIER_OPTION_TITLES.join(", ")} (run "pnpm seed:attio"). ${body}`,
      );
    }
    throw new Error(`Attio PATCH failed: ${response.status} ${body}`);
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
    formatDraftForNote("HM summary", hmNote),
    "",
    "## Fit reasoning",
    "",
    "### Pros",
    ...(pros.length > 0 ? pros.map((pro) => `- ${pro}`) : ["- None listed."]),
    "",
    "### Cons",
    ...(cons.length > 0 ? cons.map((con) => `- ${con}`) : ["- None listed."]),
  ];

  return sections.join("\n");
}

export function buildRejectionEmailNoteContent(rejectionEmailDraft: string): string {
  return formatDraftForNote(
    "Rejection email draft",
    rejectionEmailDraft,
    "_Draft only — nothing was sent automatically._",
  );
}

export function buildSilverMedalistNoteContent(input: {
  candidateName: string;
  roleTitle?: string;
  fitScore: number;
  fitTier: string;
  pros: string[];
  cons: string[];
}): string {
  const roleLabel = input.roleTitle ?? "this role";
  const sections = [
    `**${input.candidateName}** is not moving forward for **${roleLabel}**, but worth keeping warm for future roles.`,
    "",
    `**Fit:** ${input.fitScore}% (${input.fitTier})`,
    "",
    "### Why not this role",
    ...(input.cons.length > 0 ? input.cons.map((con) => `- ${con}`) : ["- No major blockers logged."]),
    "",
    "### Highlights for future",
    ...(input.pros.length > 0 ? input.pros.map((pro) => `- ${pro}`) : ["- Strong general profile."]),
    "",
    "_Logged by Recruiting Copilot — no outreach sent._",
  ];

  return sections.join("\n");
}

export function buildAudioSummaryNoteContent(script: string): string {
  return formatDraftForNote(
    "SLNG audio summary",
    script,
    "Tap **Generate audio summary** in **Recruiting Copilot** on this person, then open the link in your browser.",
  );
}
