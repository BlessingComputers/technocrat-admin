import { z } from "zod";
import { COUPON_CODE_PATTERN } from "../utils/coupon-utils";
import type {
  Coupon,
  CreateCouponInput,
  DiscountType,
  UpdateCouponInput,
} from "../types/coupons";

/**
 * The coupon form, mirroring the backend's `adminCreateCouponSchema` field for
 * field — because every rule it enforces is one the API would otherwise
 * enforce with a 400 after a round trip, and a coupon form is exactly the
 * place where "20% off, capped at ₦5,000" needs to be checked while the
 * numbers are still on screen.
 *
 * Fields are held as STRINGS, not numbers. `<Input type="number">` hands back
 * `""` for an empty box and for a half-typed `"-"`, and a form modelled on
 * `number | undefined` has to invent a meaning for both. Parsing happens once,
 * here, on submit.
 */
export interface CouponFormValues {
  /** Create only: let the server mint the code instead of typing one. */
  generateCode: boolean;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: string;
  maxDiscountAmount: string;
  minOrderAmount: string;
  maxUsageCount: string;
  maxUsagePerUser: string;
  /** `datetime-local` string ("YYYY-MM-DDTHH:mm"), or "" for no expiry. */
  expiresAt: string;
  /** Create only: whether it goes live the moment it is saved. */
  liveOnCreate: boolean;
}

/** Blank → undefined. Anything non-numeric → NaN, which the schema rejects. */
function toNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  return Number(trimmed);
}

const optionalMoney = (label: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || Number.isFinite(Number(v)), {
      message: `${label} must be a number`,
    })
    .refine((v) => v === "" || Number(v) > 0, {
      message: `${label} must be greater than zero`,
    });

const optionalCount = (label: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || Number.isInteger(Number(v)), {
      message: `${label} must be a whole number`,
    })
    .refine((v) => v === "" || Number(v) > 0, {
      message: `${label} must be at least 1`,
    });

/**
 * `mode` changes two rules, so the schema is a factory rather than a constant:
 *
 *   • create — the code may be left to the server, so it is optional when
 *     `generateCode` is on.
 *   • edit — the code already exists and is required, and an expiry that is
 *     already set cannot be cleared (see `coupons.service.ts`: the backend
 *     coerces `null` to 1970 and then 400s on its own consistency check).
 */
export function couponFormSchema(
  mode: "create" | "edit",
  existing?: Coupon,
) {
  return z
    .object({
      generateCode: z.boolean(),
      code: z.string().trim(),
      description: z
        .string()
        .trim()
        .max(255, "Keep the note under 255 characters"),
      discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
      discountValue: z
        .string()
        .trim()
        .min(1, "Enter how much comes off")
        .refine((v) => Number.isFinite(Number(v)), {
          message: "The discount must be a number",
        })
        .refine((v) => Number(v) > 0, {
          message: "The discount must be greater than zero",
        }),
      maxDiscountAmount: optionalMoney("The cap"),
      minOrderAmount: optionalMoney("The minimum order"),
      maxUsageCount: optionalCount("The total redemption limit"),
      maxUsagePerUser: optionalCount("The per-customer limit").refine(
        (v) => v !== "",
        { message: "Set how many times one customer may use it" },
      ),
      expiresAt: z.string(),
      liveOnCreate: z.boolean(),
    })
    .superRefine((values, ctx) => {
      const needsCode = mode === "edit" || !values.generateCode;
      if (needsCode && !COUPON_CODE_PATTERN.test(values.code)) {
        ctx.addIssue({
          code: "custom",
          path: ["code"],
          message: values.code
            ? "Codes are capital letters and numbers only, 3–50 characters."
            : "Enter a code, or let us generate one.",
        });
      }

      // The backend's own PERCENTAGE ceiling. Worth catching here: 400 comes
      // back naming `discountValue`, which is not what the field is called on
      // screen.
      if (
        values.discountType === "PERCENTAGE" &&
        Number(values.discountValue) > 100
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["discountValue"],
          message: "A percentage discount cannot be more than 100%.",
        });
      }

      if (values.expiresAt) {
        const expiry = new Date(values.expiresAt).getTime();
        if (Number.isNaN(expiry)) {
          ctx.addIssue({
            code: "custom",
            path: ["expiresAt"],
            message: "That is not a valid date.",
          });
        } else if (mode === "create" && expiry <= Date.now()) {
          // The backend compares against `startsAt`, which defaults to now, so
          // a past expiry is a 400. Said plainly instead.
          ctx.addIssue({
            code: "custom",
            path: ["expiresAt"],
            message: "The expiry has to be in the future.",
          });
        }
      } else if (mode === "edit" && existing?.expiresAt) {
        ctx.addIssue({
          code: "custom",
          path: ["expiresAt"],
          message:
            "An expiry can be moved but not removed — the API has no way to clear one. Disable this coupon and mint a fresh one instead.",
        });
      }
    });
}

export type CouponFormParsed = z.infer<ReturnType<typeof couponFormSchema>>;

/**
 * `datetime-local` gives a local wall-clock string with no zone; the API wants
 * ISO. `new Date("2026-09-30T23:59")` is parsed as local time, which is what
 * the person typing it meant.
 */
function toIso(local: string): string | undefined {
  if (!local) return undefined;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/** The inverse, for prefilling an edit form. */
export function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function toCreateInput(values: CouponFormParsed): CreateCouponInput {
  const isPercentage = values.discountType === "PERCENTAGE";

  return {
    // Omitted entirely when the server is minting it — sending `code: ""`
    // would fail the 3-character minimum rather than trigger generation.
    ...(values.generateCode ? {} : { code: values.code }),
    ...(values.description ? { description: values.description } : {}),
    discountType: values.discountType,
    discountValue: Number(values.discountValue),
    // A cap is only ever consulted for PERCENTAGE. Storing one on a
    // FIXED_AMOUNT coupon would be a rule the checkout never applies.
    ...(isPercentage && toNumber(values.maxDiscountAmount) !== undefined
      ? { maxDiscountAmount: Number(values.maxDiscountAmount) }
      : {}),
    ...(toNumber(values.minOrderAmount) !== undefined
      ? { minOrderAmount: Number(values.minOrderAmount) }
      : {}),
    ...(toNumber(values.maxUsageCount) !== undefined
      ? { maxUsageCount: Number(values.maxUsageCount) }
      : {}),
    maxUsagePerUser: Number(values.maxUsagePerUser),
    ...(toIso(values.expiresAt) ? { expiresAt: toIso(values.expiresAt) } : {}),
    // `startsAt` is never sent: the backend stores it and neither redemption
    // path reads it, so a scheduled coupon would be live immediately. Status
    // is the scheduling control that actually works — see `NOT_ENFORCED`.
    status: values.liveOnCreate ? "ACTIVE" : "DISABLED",
  };
}

/**
 * Only what actually changed.
 *
 * A PATCH that resends every field is not harmless here. `maxDiscountAmount`,
 * `minOrderAmount` and `maxUsageCount` cannot be sent as `null` (the backend's
 * schema has no nullable branch), so a full-body PATCH would silently rewrite
 * fields nobody touched, and `code` would be re-checked for a conflict against
 * itself. Diffing also means an empty submit fails the backend's "provide at
 * least one field" rule loudly rather than pretending to save.
 *
 * ⚠️ Clearing an amount is NOT expressible — omitting a field means "leave it",
 * and null is rejected. Removing a cap or a minimum needs a new coupon. The
 * form says so; this is the reason.
 */
export function toUpdateInput(
  values: CouponFormParsed,
  existing: Coupon,
): UpdateCouponInput {
  const input: UpdateCouponInput = {};
  const isPercentage = values.discountType === "PERCENTAGE";

  if (values.code !== existing.code) input.code = values.code;

  const description = values.description || undefined;
  if (description !== (existing.description ?? undefined)) {
    // "" is a real clear on this one field — `description` is `z.string()`,
    // so an empty string is accepted where a null amount would not be.
    input.description = values.description;
  }

  if (values.discountType !== existing.discountType) {
    input.discountType = values.discountType;
  }
  if (Number(values.discountValue) !== existing.discountValue) {
    input.discountValue = Number(values.discountValue);
  }

  const cap = isPercentage ? toNumber(values.maxDiscountAmount) : undefined;
  if (cap !== undefined && cap !== existing.maxDiscountAmount) {
    input.maxDiscountAmount = cap;
  }

  const floor = toNumber(values.minOrderAmount);
  if (floor !== undefined && floor !== existing.minOrderAmount) {
    input.minOrderAmount = floor;
  }

  const totalCap = toNumber(values.maxUsageCount);
  if (totalCap !== undefined && totalCap !== existing.maxUsageCount) {
    input.maxUsageCount = totalCap;
  }

  const perUser = Number(values.maxUsagePerUser);
  if (perUser !== existing.maxUsagePerUser) input.maxUsagePerUser = perUser;

  const expiresAt = toIso(values.expiresAt);
  if (expiresAt && expiresAt !== existing.expiresAt) {
    input.expiresAt = expiresAt;
  }

  return input;
}

/** Nothing changed — the backend would answer "Provide at least one field". */
export function isEmptyUpdate(input: UpdateCouponInput): boolean {
  return Object.keys(input).length === 0;
}

export function couponFormDefaults(existing?: Coupon): CouponFormValues {
  return {
    generateCode: false,
    code: existing?.code ?? "",
    description: existing?.description ?? "",
    discountType: existing?.discountType ?? "PERCENTAGE",
    discountValue:
      existing?.discountValue !== undefined ? String(existing.discountValue) : "",
    maxDiscountAmount: existing?.maxDiscountAmount
      ? String(existing.maxDiscountAmount)
      : "",
    minOrderAmount: existing?.minOrderAmount
      ? String(existing.minOrderAmount)
      : "",
    maxUsageCount: existing?.maxUsageCount ? String(existing.maxUsageCount) : "",
    maxUsagePerUser: String(existing?.maxUsagePerUser ?? 1),
    expiresAt: toLocalInputValue(existing?.expiresAt),
    liveOnCreate: true,
  };
}
