// Extracts only the Solar icons we actually use into a small committed JSON,
// so icons render fully offline (no Iconify CDN calls) without bundling the
// entire multi-thousand-icon Solar set. Re-run after editing ICON_NAMES:
//   npm run gen:icons
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { getIcons } from "@iconify/utils";

const require = createRequire(import.meta.url);
const solar = require("@iconify-json/solar/icons.json");

// Base names; each gets a `-linear` (inactive) and `-bold` (active) variant.
const BASES = [
  "widget-5", // Dashboard
  "box", // Products
  "cart-large-2", // Orders
  "users-group-rounded", // Customers
  "bill-list", // Invoices
  "bill-check", // Invoices: approved KPI
  "bill-cross", // Invoices: rejected KPI
  "box-minimalistic", // Inventories
  "shield-user", // Users
  "chart-2", // Sales
  "share", // Socials
  "shield-keyhole", // Security
  "card", // Bank Accounts
  "settings", // Settings
  // chrome / misc
  "magnifer", // search
  "bell", // notifications
  "question-circle", // help
  "logout-2", // log out (topbar menu / logout modal)
  "danger-triangle", // confirm/alert modals
  "sun-2", // theme: light
  "moon", // theme: dark
  "shield-warning", // emergency unblock
  "lock-keyhole-unlocked", // emergency unblock action
  // auth / login
  "shield-check", // login brand mark
  "eye", // password reveal
  "eye-closed", // password hide
  "lock-keyhole-minimalistic", // login submit / security note
  // dashboard
  "arrow-right-up", // KPI trend up
  "arrow-right-down", // KPI trend down
  "menu-dots", // card actions
  "calendar", // date filter
  "calendar-mark", // date input
  "magic-stick-3", // active range sparkle
  "filter", // recent-orders filter
  "inbox", // empty state
  "pulse", // staff activity
  "dollar-minimalistic", // refunds
  // orders feature
  "clock-circle", // awaiting payment / audit timestamp
  "document-text", // pending review / notes
  "wallet", // potential revenue
  "user", // customer / actor
  "letter", // email
  "phone", // phone
  "map-point", // delivery address
  "delivery", // dispatch / delivery method
  "shop", // pick-up method
  "arrow-left", // back nav
  "danger-circle", // error / alert
  "forbidden-circle", // cancel / ban
  "close-circle", // reject
  "check-circle", // confirm / done
  "square-arrow-right-up", // external link (proof)
  "copy", // copy invoice number
  "refresh", // status refresh
  "buildings-3", // bank
  "pen-2", // edit
  "power", // toggle active
  "trash-bin-trash", // delete
  "star", // primary / make primary
  "add-circle", // add new
  // products list
  "alt-arrow-left", // pagination prev
  "alt-arrow-right", // pagination next
  "alt-arrow-up", // sort asc
  "alt-arrow-down", // sort desc
  // product detail
  "info-circle", // about / empty states
  "tag", // classification
  "layers-minimalistic", // system metadata
  "gallery", // product image gallery
  "gallery-add", // bulk-upload images dropzone
  // product form
  "cloud-upload", // image upload dropzone
  // taxonomy (brands & categories)
  "folder", // categories
  "folder-open", // selected category
  // users (RBAC)
  "key", // permissions tab
  "user-plus-rounded", // onboard staff
  // chat
  "chat-round", // Chat nav + conversation glyph
  "chat-round-dots", // conversation with activity
  "plain-2", // send message
  "check-read", // read receipt (double tick)
  "file", // staff-room file action
  "paperclip", // composer attach
  "hand-shake", // queue: take/self-assign
  "sidebar-minimalistic", // toggle context panel
  "stop-circle", // AI stop control (A5)
  "play-circle", // AI resume control (A5)
  // help center (ADR-0011 Doc Kit + guides)
  "compass", // getting-started / hub orientation
  "hamburger-menu", // sidebar drawer
  "widget-2", // top bar
  "list", // sidebar / field reference
  "book", // browse all guides
  "cpu-bolt", // uploading parts
  "routing-2", // two ways to add parts
  "link", // attach existing part
  "link-broken", // remove from product
  "tag-price", // pricing & markup
  "lightbulb-bolt", // callout: tip
  // whatsapp inbox
  "chat-square-call", // WhatsApp nav + inbox glyph
  "smartphone", // customer's WhatsApp number
  "hourglass", // 24h reply window
  // monitor (Security section)
  "bolt", // stats: max latency KPI
  "shield-cross", // access-gate restricted state (also used by payments' gate,
  // which was missing this from the subset — fixed here since it's the same icon)
];

const names = BASES.flatMap((b) => [`${b}-linear`, `${b}-bold`]);
const subset = getIcons(solar, names);

const missing = names.filter(
  (n) => !subset?.icons?.[n] && !subset?.aliases?.[n],
);
if (missing.length) {
  console.error("Missing Solar icons:\n  " + missing.join("\n  "));
  process.exit(1);
}

const out = "src/lib/icons/solar-subset.json";
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(subset));
console.log(`Wrote ${Object.keys(subset.icons).length} icons → ${out}`);
