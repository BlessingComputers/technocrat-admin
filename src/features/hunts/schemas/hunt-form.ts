import { z } from "zod";

import { formatPrice } from "@/lib/utils/format";

import {
  HUNT_MIN_PERCENTAGE,
  lowestHuntPrice,
  percentageForPrice,
} from "../utils/hunt-price";
import { HUNT_MAX_DROPS } from "../utils/hunt-schedule";

/**
 * Hunt campaign form input (ADR-0006: Zod owns request and form inputs).
 *
 * Every write rule the backend applies is checked here, plus three it does not
 * apply and should:
 *
 * - The window check runs against every drop on every save. The backend only
 *   runs it on create. A campaign `PATCH` that moves the window, or a per-drop
 *   `PATCH` that moves a slot, is never checked against the other.
 * - Two drops may not overlap, and two countdowns may not run at once. The
 *   public payload carries one countdown, so the second drop would open with
 *   no warning.
 * - Two drops may not share a product. A product holds one pricing rule at a
 *   time, and the first drop's rule stays on it after the slot closes, so the
 *   second would never start.
 *
 * Times are ISO strings, already converted from the WAT inputs. Messages name
 * the drop by its position on screen, because the server's 400s name array
 * indexes nobody can see.
 */

const dropSchema = z.object({
  /** Row identity. The hunt deal's id in edit mode. */
  key: z.string(),
  /**
   * Held, claimed, or already opened. Never sent, and exempt from the per-drop
   * rules, but it still counts for the window and for overlaps.
   */
  locked: z.boolean(),
  productId: z.string().nullable(),
  /** Carried into the Deal's target `notes`, so the Deals screen can name it. */
  productName: z.string().nullable(),
  /** The cheapest variant's `basePrice`, the one the backend prices from. */
  basePrice: z.number().nullable(),
  /** The naira price staff typed. */
  price: z.number().nullable(),
  /**
   * The saved percentage, in edit mode, until staff retype the price or change
   * the product. Sent as-is so an untouched drop is not re-rounded.
   */
  storedPercentage: z.number().nullable(),
  slotStart: z.string().nullable(),
  slotEnd: z.string().nullable(),
  revealAt: z.string().nullable(),
});

export type HuntDropValues = z.infer<typeof dropSchema>;

/** The percentage a drop will save: the stored one, or one computed from the typed price. */
export function dropPercentage(
  drop: Pick<HuntDropValues, "basePrice" | "price" | "storedPercentage">,
): number | null {
  if (drop.storedPercentage !== null) return drop.storedPercentage;
  if (drop.basePrice === null || drop.basePrice <= 0 || drop.price === null) {
    return null;
  }
  return percentageForPrice(drop.basePrice, drop.price);
}

const at = (iso: string | null) => (iso ? new Date(iso).getTime() : Number.NaN);

/** Built per save, because "already passed" depends on when Save was pressed. */
export function huntFormSchema(now: number) {
  return z
    .object({
      // Checked in the refinement below with everything else, so one save
      // lists every problem instead of the name alone.
      name: z.string(),
      windowStart: z.string().nullable(),
      windowEnd: z.string().nullable(),
      drops: z
        .array(dropSchema)
        .min(1, "A campaign needs at least one drop")
        .max(HUNT_MAX_DROPS, `A campaign takes at most ${HUNT_MAX_DROPS} drops`),
    })
    .superRefine((form, ctx) => {
      const issue = (message: string, path: (string | number)[]) =>
        ctx.addIssue({ code: "custom", message, path });

      const name = form.name.trim();
      if (name.length < 2) issue("Give the campaign a name", ["name"]);
      else if (name.length > 150) issue("Keep the name under 150 characters", ["name"]);

      const ws = at(form.windowStart);
      const we = at(form.windowEnd);
      const hasWindow = Number.isFinite(ws) && Number.isFinite(we) && we > ws;

      if (!form.windowStart) issue("Set when the window opens", ["windowStart"]);
      if (!form.windowEnd) issue("Set when the window closes", ["windowEnd"]);
      if (Number.isFinite(ws) && Number.isFinite(we) && we <= ws) {
        issue("The window must close after it opens", ["windowEnd"]);
      }

      const firstUse = new Map<string, number>();
      form.drops.forEach((drop, i) => {
        if (!drop.productId) return;
        const first = firstUse.get(drop.productId);
        if (first === undefined) {
          firstUse.set(drop.productId, i);
          return;
        }
        issue(
          `Drops ${first + 1} and ${i + 1} are the same product. A product holds one pricing rule at a time, so drop ${i + 1} would never start`,
          ["drops", i, "productId"],
        );
      });

      form.drops.forEach((drop, i) => {
        const n = i + 1;
        const path = (field: string) => ["drops", i, field];
        const s = at(drop.slotStart);
        const e = at(drop.slotEnd);
        const r = at(drop.revealAt);

        // Locked or not, a drop must sit inside the window. A window edit is
        // never checked against the drops by the backend.
        if (hasWindow && Number.isFinite(s) && Number.isFinite(e) && (s < ws || e > we)) {
          issue(`Drop ${n}'s slot must sit inside the window`, path("slotStart"));
        }
        if (hasWindow && Number.isFinite(r) && r < ws) {
          issue(`Drop ${n}'s countdown can't go public before the window opens`, path("revealAt"));
        }

        if (drop.locked) return;

        if (!drop.productId) {
          issue(`Pick a product for drop ${n}`, path("productId"));
        } else if (drop.basePrice === null) {
          issue(`Drop ${n}'s product has no base price to discount`, path("price"));
        } else {
          const pct = dropPercentage(drop);
          if (pct === null) {
            issue(`Enter drop ${n}'s hunt price`, path("price"));
          } else if (pct >= 0) {
            issue(
              `Drop ${n}'s hunt price must be below its base price of ${formatPrice(drop.basePrice)}`,
              path("price"),
            );
          } else if (pct < HUNT_MIN_PERCENTAGE) {
            issue(
              `Drop ${n}'s hunt price can't go below ${formatPrice(lowestHuntPrice(drop.basePrice))}, which is 99% off`,
              path("price"),
            );
          }
        }

        if (!Number.isFinite(s)) {
          issue(`Set drop ${n}'s slot start`, path("slotStart"));
        } else if (s <= now) {
          issue(`Drop ${n}'s slot start has already passed`, path("slotStart"));
        }
        if (!Number.isFinite(e)) {
          issue(`Set drop ${n}'s slot end`, path("slotEnd"));
        } else if (Number.isFinite(s) && e <= s) {
          issue(`Drop ${n}'s slot must end after it starts`, path("slotEnd"));
        }
        if (!Number.isFinite(r)) {
          issue(`Set when drop ${n}'s countdown goes public`, path("revealAt"));
        } else if (Number.isFinite(s) && r > s) {
          issue(`Drop ${n}'s countdown must go public before its slot starts`, path("revealAt"));
        }
      });

      const timed = form.drops
        .map((drop, i) => ({
          i,
          s: at(drop.slotStart),
          e: at(drop.slotEnd),
          r: at(drop.revealAt),
        }))
        .filter((t) => [t.s, t.e, t.r].every(Number.isFinite) && t.e > t.s && t.r <= t.s);

      for (let a = 0; a < timed.length; a++) {
        for (let b = a + 1; b < timed.length; b++) {
          const [first, second] =
            timed[a].s <= timed[b].s ? [timed[a], timed[b]] : [timed[b], timed[a]];
          const pair = `Drops ${Math.min(first.i, second.i) + 1} and ${Math.max(first.i, second.i) + 1}`;
          if (second.s < first.e) {
            issue(`${pair} overlap. One drop runs at a time`, ["drops", second.i, "slotStart"]);
          } else if (second.r < first.s) {
            issue(
              `${pair} would count down at the same time. The public page shows one countdown, so one would open unannounced`,
              ["drops", second.i, "revealAt"],
            );
          }
        }
      }
    });
}

export type HuntFormInput = z.input<ReturnType<typeof huntFormSchema>>;
export type HuntFormValues = z.infer<ReturnType<typeof huntFormSchema>>;

/** Problems sorted by where the form shows them. `all` feeds the summary by the Save button. */
export interface HuntFormIssues {
  name: string[];
  windowStart: string[];
  windowEnd: string[];
  /** By drop position. */
  drops: Map<number, string[]>;
  other: string[];
  all: string[];
}

export function groupIssues(
  issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>,
): HuntFormIssues {
  const out: HuntFormIssues = {
    name: [],
    windowStart: [],
    windowEnd: [],
    drops: new Map(),
    other: [],
    all: [],
  };
  for (const { path, message } of issues) {
    if (!out.all.includes(message)) out.all.push(message);
    const [head, index] = path;
    if (head === "drops" && typeof index === "number") {
      out.drops.set(index, [...(out.drops.get(index) ?? []), message]);
    } else if (head === "name" || head === "windowStart" || head === "windowEnd") {
      out[head].push(message);
    } else {
      out.other.push(message);
    }
  }
  return out;
}
