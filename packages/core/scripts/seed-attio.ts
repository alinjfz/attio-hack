import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = resolve(__dirname, "../fixtures");

config({ path: resolve(__dirname, "../../../.env") });

const BASE_URL = process.env.ATTIO_BASE_URL ?? "https://api.attio.com/v2";
const TOKEN = process.env.ATTIO_API_TOKEN?.trim();

interface SeedManifest {
  roleObjectSlug: string;
  listSlug: string;
  listName: string;
  roles: Array<{
    key: string;
    title: string;
    descriptionFile: string;
    recordId?: string;
  }>;
  candidates: Array<{
    key: string;
    firstName: string;
    lastName: string;
    linkedinUrl: string;
    cvFile: string;
    roleKey: string;
    recordId?: string;
  }>;
}

type AttioValue = {
  value?: string | number;
  target_record_id?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
};

type AttioRecord = {
  id: { record_id: string };
  values?: Record<string, AttioValue[]>;
  web_url?: string;
};

async function attioRequest<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ ok: boolean; status: number; data: T; text: string }> {
  if (!TOKEN) {
    throw new Error("ATTIO_API_TOKEN is missing. Add it to .env from build.attio.com.");
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
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

async function ensureObject(slug: string, singular: string, plural: string): Promise<void> {
  const existing = await attioRequest<{ data: Array<{ api_slug: string }> }>("GET", "/objects");
  if (!existing.ok) {
    throw new Error(`Failed to list objects: ${existing.status} ${existing.text}`);
  }

  if (existing.data.data?.some((object) => object.api_slug === slug)) {
    console.log(`✓ Object "${slug}" already exists`);
    return;
  }

  const created = await attioRequest("POST", "/objects", {
    data: {
      api_slug: slug,
      singular_noun: singular,
      plural_noun: plural,
    },
  });

  if (!created.ok) {
    throw new Error(`Failed to create object "${slug}": ${created.status} ${created.text}`);
  }

  console.log(`✓ Created object "${slug}"`);
}

async function ensureAttribute(
  target: "objects",
  identifier: string,
  definition: {
    title: string;
    api_slug: string;
    type: string;
    description?: string;
    config?: Record<string, unknown>;
  },
): Promise<void> {
  const list = await attioRequest<{ data: Array<{ api_slug: string }> }>(
    "GET",
    `/${target}/${identifier}/attributes`,
  );

  if (list.ok && list.data.data?.some((attribute) => attribute.api_slug === definition.api_slug)) {
    console.log(`  ✓ Attribute ${identifier}.${definition.api_slug} already exists`);
    return;
  }

  const created = await attioRequest("POST", `/${target}/${identifier}/attributes`, {
    data: {
      title: definition.title,
      api_slug: definition.api_slug,
      type: definition.type,
      description: definition.description ?? definition.title,
      is_required: false,
      is_unique: false,
      is_multiselect: false,
      config: definition.config ?? {},
    },
  });

  if (!created.ok) {
    if (created.status === 409) {
      console.log(`  ✓ Attribute ${identifier}.${definition.api_slug} already exists`);
      return;
    }
    throw new Error(
      `Failed to create attribute ${identifier}.${definition.api_slug}: ${created.status} ${created.text}`,
    );
  }

  console.log(`  ✓ Created attribute ${identifier}.${definition.api_slug}`);
}

async function ensureSelectOptions(
  identifier: string,
  attributeSlug: string,
  titles: string[],
): Promise<void> {
  const list = await attioRequest<{ data: Array<{ title: string }> }>(
    "GET",
    `/objects/${identifier}/attributes/${attributeSlug}/options`,
  );

  if (!list.ok) {
    throw new Error(
      `Failed to list ${identifier}.${attributeSlug} options: ${list.status} ${list.text}`,
    );
  }

  const existing = new Set(
    (list.data.data ?? []).map((option) => option.title.toLowerCase()),
  );

  for (const title of titles) {
    if (existing.has(title.toLowerCase())) {
      continue;
    }

    const created = await attioRequest(
      "POST",
      `/objects/${identifier}/attributes/${attributeSlug}/options`,
      { data: { title } },
    );

    if (!created.ok && created.status !== 409) {
      throw new Error(
        `Failed to create select option "${title}" on ${identifier}.${attributeSlug}: ${created.status} ${created.text}`,
      );
    }

    console.log(`  ✓ Select option ${identifier}.${attributeSlug}.${title}`);
  }
}

async function ensureSchema(roleObjectSlug: string): Promise<void> {
  console.log("\nSchema");

  await ensureObject(roleObjectSlug, "Role", "Roles");

  for (const attribute of [
    { title: "Title", api_slug: "title", type: "text" },
    { title: "Description", api_slug: "description", type: "text" },
  ]) {
    await ensureAttribute("objects", roleObjectSlug, attribute);
  }

  for (const attribute of [
    { title: "CV text", api_slug: "cv_text", type: "text" },
    { title: "LinkedIn URL", api_slug: "linkedin_url", type: "text" },
    { title: "Fit score", api_slug: "fit_score", type: "number" },
    { title: "2-line summary", api_slug: "two_liner", type: "text" },
    { title: "Audio summary script", api_slug: "audio_summary_script", type: "text" },
    {
      title: "Role",
      api_slug: "role",
      type: "record-reference",
      config: {
        record_reference: {
          allowed_objects: [roleObjectSlug],
        },
      },
    },
    {
      title: "Fit tier",
      api_slug: "fit_tier",
      type: "select",
      config: {
        options: [
          { title: "Strong" },
          { title: "Good" },
          { title: "Weak" },
          { title: "Unknown" },
        ],
      },
    },
  ]) {
    await ensureAttribute("objects", "people", attribute);
  }

  await ensureSelectOptions("people", "fit_tier", [
    "Strong",
    "Good",
    "Weak",
    "Unknown",
  ]);
}

async function listRecords(objectSlug: string): Promise<AttioRecord[]> {
  const response = await attioRequest<{ data: AttioRecord[] }>(
    "POST",
    `/objects/${objectSlug}/records/query`,
    { limit: 200 },
  );

  if (!response.ok) {
    throw new Error(`Failed to query ${objectSlug}: ${response.status} ${response.text}`);
  }

  return response.data.data ?? [];
}

function readName(record: AttioRecord): { firstName?: string; lastName?: string; fullName?: string } {
  const entry = record.values?.name?.[0];
  return {
    firstName: entry?.first_name,
    lastName: entry?.last_name,
    fullName: entry?.full_name,
  };
}

function readTextValue(record: AttioRecord, slug: string): string | undefined {
  const entry = record.values?.[slug]?.[0];
  return typeof entry?.value === "string" ? entry.value : undefined;
}

async function findRoleRecordId(
  roleObjectSlug: string,
  title: string,
  recordId?: string,
): Promise<string | undefined> {
  if (recordId) {
    return recordId;
  }

  const records = await listRecords(roleObjectSlug);
  const match = records.find((record) => readTextValue(record, "title") === title);
  return match?.id.record_id;
}

async function findPersonRecordId(
  firstName: string,
  lastName: string,
  recordId?: string,
): Promise<string | undefined> {
  if (recordId) {
    return recordId;
  }

  const records = await listRecords("people");
  const match = records.find((record) => {
    const name = readName(record);
    return (
      name.firstName?.toLowerCase() === firstName.toLowerCase() &&
      name.lastName?.toLowerCase() === lastName.toLowerCase()
    );
  });
  return match?.id.record_id;
}

async function patchRoleRecord(
  roleObjectSlug: string,
  recordId: string,
  title: string,
  description: string,
): Promise<void> {
  const response = await attioRequest(
    "PATCH",
    `/objects/${roleObjectSlug}/records/${recordId}`,
    {
      data: {
        values: {
          title: [{ value: title }],
          description: [{ value: description }],
        },
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to update role "${title}": ${response.status} ${response.text}`);
  }
}

async function patchPersonRecord(input: {
  recordId: string;
  label: string;
  linkedinUrl: string;
  cvText: string;
  roleObjectSlug: string;
  roleRecordId: string;
}): Promise<void> {
  const response = await attioRequest(
    "PATCH",
    `/objects/people/records/${input.recordId}`,
    {
      data: {
        values: {
          cv_text: [{ value: input.cvText }],
          linkedin_url: [{ value: input.linkedinUrl }],
          role: [
            {
              target_object: input.roleObjectSlug,
              target_record_id: input.roleRecordId,
            },
          ],
        },
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to update person "${input.label}": ${response.status} ${response.text}`);
  }

  console.log(`  ✓ Updated ${input.label} (${input.recordId})`);
}

async function ensureList(listSlug: string, listName: string): Promise<string> {
  const lists = await attioRequest<{ data: Array<{ id: { list_id: string }; api_slug: string }> }>(
    "GET",
    "/lists",
  );

  if (!lists.ok) {
    throw new Error(`Failed to list lists: ${lists.status} ${lists.text}`);
  }

  const existing = lists.data.data?.find((list) => list.api_slug === listSlug);
  if (existing) {
    console.log(`✓ List "${listName}" already exists`);
    return existing.id.list_id;
  }

  const created = await attioRequest<{ data: { id: { list_id: string } } }>("POST", "/lists", {
    data: {
      api_slug: listSlug,
      name: listName,
      parent_object: ["people"],
      workspace_access: "full-access",
    },
  });

  if (!created.ok) {
    throw new Error(`Failed to create list "${listName}": ${created.status} ${created.text}`);
  }

  console.log(`✓ Created list "${listName}"`);
  return created.data.data.id.list_id;
}

async function personOnList(listId: string, personRecordId: string): Promise<boolean> {
  const response = await attioRequest<{
    data: Array<{ parent_record_id?: string }>;
  }>("POST", `/lists/${listId}/entries/query`, { limit: 200 });

  if (!response.ok) {
    return false;
  }

  return (response.data.data ?? []).some((entry) => entry.parent_record_id === personRecordId);
}

async function addPersonToList(listId: string, personRecordId: string): Promise<void> {
  if (await personOnList(listId, personRecordId)) {
    console.log(`  ✓ Person already on recruiting list`);
    return;
  }

  const response = await attioRequest("POST", `/lists/${listId}/entries`, {
    data: {
      parent_object: "people",
      parent_record_id: personRecordId,
      entry_values: {},
    },
  });

  if (!response.ok) {
    if (response.status === 409) {
      console.log(`  ✓ Person already on recruiting list`);
      return;
    }
    throw new Error(`Failed to add person to list: ${response.status} ${response.text}`);
  }

  console.log(`  ✓ Added person to recruiting list`);
}

function readFixture(relativePath: string): string {
  return readFileSync(resolve(fixturesDir, relativePath), "utf8").trim();
}

async function main(): Promise<void> {
  const manifest = JSON.parse(
    readFileSync(resolve(fixturesDir, "demo-seed.json"), "utf8"),
  ) as SeedManifest;

  console.log("Recruiting Copilot — update existing Attio demo data");
  console.log(`API: ${BASE_URL}`);

  await ensureSchema(manifest.roleObjectSlug);

  console.log("\nRoles (update existing only)");
  const roleIds = new Map<string, string>();
  for (const role of manifest.roles) {
    const description = readFixture(role.descriptionFile);
    const recordId = await findRoleRecordId(
      manifest.roleObjectSlug,
      role.title,
      role.recordId,
    );

    if (!recordId) {
      console.log(`  ⚠ Role "${role.title}" not found — create it once manually, then re-run seed`);
      continue;
    }

    await patchRoleRecord(manifest.roleObjectSlug, recordId, role.title, description);
    roleIds.set(role.key, recordId);
    console.log(`  ✓ Role "${role.title}" → ${recordId}`);
  }

  console.log("\nCandidates (update existing only)");
  const personIds: string[] = [];
  for (const candidate of manifest.candidates) {
    const roleRecordId = roleIds.get(candidate.roleKey);
    if (!roleRecordId) {
      console.log(`  ⚠ Skipping ${candidate.firstName} ${candidate.lastName} — role not found`);
      continue;
    }

    const recordId = await findPersonRecordId(
      candidate.firstName,
      candidate.lastName,
      candidate.recordId,
    );

    if (!recordId) {
      console.log(
        `  ⚠ Person ${candidate.firstName} ${candidate.lastName} not found — skipping (no new people created)`,
      );
      continue;
    }

    const label = `${candidate.firstName} ${candidate.lastName}`;
    await patchPersonRecord({
      recordId,
      label,
      linkedinUrl: candidate.linkedinUrl,
      cvText: readFixture(candidate.cvFile),
      roleObjectSlug: manifest.roleObjectSlug,
      roleRecordId,
    });
    personIds.push(recordId);
  }

  if (personIds.length > 0) {
    console.log("\nRecruiting list");
    const listId = await ensureList(manifest.listSlug, manifest.listName);
    for (const personRecordId of personIds) {
      await addPersonToList(listId, personRecordId);
    }
  }

  console.log("\nDone. Existing people were updated; no new person records were created.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
