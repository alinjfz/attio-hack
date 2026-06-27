import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../../.env") });

const TOKEN = process.env.ATTIO_API_TOKEN?.trim();
const BASE = "https://api.attio.com/v2";

async function main() {
  const listsRes = await fetch(`${BASE}/lists`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  }).then((r) => r.json());

  const recruiting = listsRes.data?.find(
    (l: { api_slug?: string; name?: string }) =>
      l.api_slug === "recruiting" || l.name?.toLowerCase().includes("recruit"),
  );

  console.log("RECRUITING LIST:", recruiting?.name, recruiting?.id?.list_id);

  if (recruiting?.id?.list_id) {
    const entries = await fetch(`${BASE}/lists/${recruiting.id.list_id}/entries/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ limit: 50 }),
    }).then((r) => r.json());

    for (const entry of entries.data ?? []) {
      const id = entry.parent_record_id;
      if (!id) continue;
      const person = await fetch(`${BASE}/objects/people/records/${id}`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
      }).then((r) => r.json());
      const name = person.data?.values?.name?.[0];
      const full =
        name?.full_name || [name?.first_name, name?.last_name].filter(Boolean).join(" ");
      const cv = person.data?.values?.cv_text?.[0]?.value;
      const role = person.data?.values?.role?.[0]?.target_record_id;
      console.log({ id, full, hasCv: Boolean(cv), hasRole: Boolean(role) });
    }
  }

  console.log("\nALL PEOPLE:");
  const people = await fetch(`${BASE}/objects/people/records/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ limit: 50 }),
  }).then((r) => r.json());

  for (const p of people.data ?? []) {
    const n = p.values?.name?.[0];
    const full = n?.full_name || [n?.first_name, n?.last_name].filter(Boolean).join(" ");
    if (full) console.log(full, "->", p.id.record_id);
  }
}

main();
