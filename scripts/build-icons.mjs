// Extracts only the Solar icons we actually use into a small committed JSON,
// so icons render fully offline (no Iconify CDN calls) without bundling the
// entire multi-thousand-icon Solar set. Also emits a tiny hand-authored `brand`
// collection for third-party marks Solar doesn't ship (WhatsApp).
//
// The icon list is every `solar:<name>` / `brand:<name>` literal in src/, so
// there is no hand-kept list to forget. Runs before `dev` and `build`;
// `npm run gen:icons` runs it by hand. Icon names must stay literal strings
// (no `solar:${base}-bold` templates) or the scan cannot see them.
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { getIcons } from "@iconify/utils";

const require = createRequire(import.meta.url);
const solar = require("@iconify-json/solar/icons.json");

const ICON_RE = /\b(solar|brand):([a-z0-9]+(?:-[a-z0-9]+)*)/g;

/** name → first file that uses it, per collection. */
const used = { solar: new Map(), brand: new Map() };
for (const entry of readdirSync("src", { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || !/\.(tsx?|mdx?)$/.test(entry.name)) continue;
  const file = join(entry.parentPath, entry.name);
  for (const [, prefix, name] of readFileSync(file, "utf8").matchAll(ICON_RE)) {
    if (!used[prefix].has(name)) used[prefix].set(name, file);
  }
}

/**
 * Third-party brand marks Solar does not ship. Hand-authored rather than pulled
 * from another Iconify set so the glyph is byte-identical to the storefront's
 * `shared/ui/whatsapp-icon.tsx` — the two apps must show the same WhatsApp mark.
 * Source: Simple Icons (CC0). Single-form (no linear/bold pair): a brand mark
 * has one official shape, so the nav points `icon` and `iconActive` at the same
 * name and lets colour alone carry the active state.
 */
const BRAND_ICONS = {
  whatsapp:
    "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z",
};

const names = [...used.solar.keys()].sort();
const subset = getIcons(solar, names);

const missing = [
  ...names
    .filter((n) => !subset?.icons?.[n] && !subset?.aliases?.[n])
    .map((n) => `solar:${n}  (${used.solar.get(n)})`),
  ...[...used.brand.keys()]
    .filter((n) => !(n in BRAND_ICONS))
    .map((n) => `brand:${n}  (${used.brand.get(n)}) — add it to BRAND_ICONS`),
];
if (missing.length) {
  console.error("Unknown icons:\n  " + missing.join("\n  "));
  process.exit(1);
}

const brand = {
  prefix: "brand",
  width: 24,
  height: 24,
  icons: Object.fromEntries(
    Object.entries(BRAND_ICONS).map(([name, d]) => [name, { body: `<path fill="currentColor" d="${d}"/>` }]),
  ),
};

const outputs = [
  ["src/lib/icons/solar-subset.json", subset],
  ["src/lib/icons/brand-subset.json", brand],
];

for (const [out, collection] of outputs) {
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(collection));
  console.log(`Wrote ${Object.keys(collection.icons).length} icons → ${out}`);
}
