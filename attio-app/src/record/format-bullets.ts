export function formatBulletSection(title: string, items: string[], empty = "None listed."): string {
  if (items.length === 0) {
    return `${title}\n${empty}`;
  }
  return [title, ...items.map((item) => `• ${item}`)].join("\n");
}

export function formatBulletList(items: string[], empty = "None listed."): string {
  if (items.length === 0) {
    return empty;
  }
  return items.map((item) => `• ${item}`).join("\n");
}
