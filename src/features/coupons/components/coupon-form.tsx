"use client";

import { useState } from "react";
import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  couponFormDefaults,
  couponFormSchema,
  type CouponFormParsed,
  type CouponFormValues,
} from "../schemas/coupon-form";
import { normalizeCouponCode } from "../utils/coupon-utils";
import { CouponOfferPreview } from "./coupon-offer-preview";
import type { Coupon, DiscountType } from "../types/coupons";

interface CouponFormProps {
  /** Present in edit mode. Also switches the code and expiry rules. */
  coupon?: Coupon;
  onSubmit: (values: CouponFormParsed) => void;
  isPending: boolean;
  submitLabel: string;
}

type FieldErrors = Partial<Record<keyof CouponFormValues, string>>;

/**
 * The one form, for both minting and editing.
 *
 * Per-field errors rather than the single error line the promotions form uses:
 * this form has nine inputs and four of them constrain each other, so "please
 * check the form" would make someone hunt. The messages are ours, not the
 * backend's — a 400 comes back naming `discountValue`, which is not what the
 * field is called on screen.
 *
 * This form used to justify two deliberate omissions, and backend `b2661a1`
 * resolved both — in opposite directions. `applicableCategoryId` and friends
 * were **deleted** from the API rather than made to work, so there is no longer
 * a field to decline. `startsAt` went the other way and is **now enforced** on
 * every redemption path, so a "Starts" control would today be a real scheduling
 * promise rather than a lie.
 *
 * It is still not offered here, and that is now a scope call rather than a
 * correctness one: scheduling needs a date-time control, cross-field validation
 * against `expiresAt`, and an answer to the fact that the API cannot clear a
 * date once set (`z.coerce.date()` turns `null` into 1970-01-01 and then 400s —
 * `BACKEND-ASKS.md` item 18). The live/not-live checkbox covers the common case
 * meanwhile. `startsAt` IS read back and shown on the edit screen.
 *
 * See `NOT_ENFORCED` in `../types/coupons` for the full history.
 */
export function CouponForm({
  coupon,
  onSubmit,
  isPending,
  submitLabel,
}: CouponFormProps) {
  const mode = coupon ? "edit" : "create";
  const [values, setValues] = useState<CouponFormValues>(() =>
    couponFormDefaults(coupon),
  );
  const [errors, setErrors] = useState<FieldErrors>({});

  const set = <K extends keyof CouponFormValues>(
    key: K,
    value: CouponFormValues[K],
  ) => {
    setValues((v) => ({ ...v, [key]: value }));
    // Clear this field's complaint as soon as it is touched; leave the others,
    // since they are still true.
    setErrors((e) => (key in e ? { ...e, [key]: undefined } : e));
  };

  const isPercentage = values.discountType === "PERCENTAGE";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = couponFormSchema(mode, coupon).safeParse(values);

    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof CouponFormValues | undefined;
        // First message per field wins — later ones are usually the same
        // complaint said twice (not a number, then not positive).
        if (field && !next[field]) next[field] = issue.message;
      }
      setErrors(next);
      return;
    }

    setErrors({});
    onSubmit(parsed.data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* ── The code ───────────────────────────────────────────────────── */}
      <section className="space-y-3">
        {mode === "create" && (
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="coupon-generate"
              className="mt-0.5"
              checked={values.generateCode}
              onCheckedChange={(checked) =>
                set("generateCode", checked === true)
              }
            />
            <div className="space-y-0.5">
              <Label htmlFor="coupon-generate" className="font-normal">
                Generate a code for me
              </Label>
              <p className="text-xs text-muted-foreground">
                Eight characters, guaranteed unique, with 0/O and 1/I left out
                so nobody mistypes it off a banner.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="coupon-code">Code</Label>
          <Input
            id="coupon-code"
            placeholder="SAVE20"
            className="font-mono tracking-wide"
            value={values.code}
            disabled={values.generateCode}
            autoFocus={mode === "create"}
            // Uppercased and stripped as it is typed, rather than rejected on
            // submit — "save 20" is a reasonable thing to type and an
            // unreasonable thing to be told off for.
            onChange={(e) => set("code", normalizeCouponCode(e.target.value))}
            aria-invalid={!!errors.code}
            aria-describedby={errors.code ? "coupon-code-error" : undefined}
          />
          <FieldNote id="coupon-code-error" error={errors.code}>
            {values.generateCode
              ? "The server picks this. It comes back on the next screen."
              : "Capital letters and numbers, 3–50 characters. Customers type it exactly as written."}
          </FieldNote>
          {/* Only once the code has actually been changed. A standing warning
              on every edit would be read past by the third visit, which is the
              one where it matters. */}
          {coupon && values.code !== coupon.code && (
            <p className="flex items-start gap-2 text-xs text-warning-ink">
              <AppIcon
                icon="solar:danger-triangle-linear"
                className="mt-0.5 size-3.5 shrink-0"
              />
              Renaming breaks{" "}
              <span className="font-mono">{coupon.code}</span> everywhere it has
              already been printed or sent — the old spelling stops working the
              moment you save.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="coupon-description">Note</Label>
          <Textarea
            id="coupon-description"
            placeholder="What this code is for — August promo, influencer batch, apology to a customer."
            rows={2}
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            aria-invalid={!!errors.description}
          />
          <FieldNote error={errors.description}>
            For your own reference. Customers never see it.
          </FieldNote>
        </div>
      </section>

      {/* ── The discount ───────────────────────────────────────────────── */}
      <section className="space-y-4 border-t border-border pt-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="coupon-type">Discount</Label>
            <Select
              value={values.discountType}
              onValueChange={(next) => set("discountType", next as DiscountType)}
            >
              <SelectTrigger id="coupon-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENTAGE">Percentage off</SelectItem>
                <SelectItem value="FIXED_AMOUNT">Fixed amount off</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="coupon-value">
              {isPercentage ? "How much off (%)" : "How much off (₦)"}
            </Label>
            <Input
              id="coupon-value"
              type="number"
              inputMode="decimal"
              min={0}
              max={isPercentage ? 100 : undefined}
              step="any"
              placeholder={isPercentage ? "20" : "2000"}
              value={values.discountValue}
              onChange={(e) => set("discountValue", e.target.value)}
              aria-invalid={!!errors.discountValue}
              aria-describedby={
                errors.discountValue ? "coupon-value-error" : undefined
              }
            />
            <FieldNote id="coupon-value-error" error={errors.discountValue} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* The cap is PERCENTAGE-only because the backend only consults it
              there. Rendering it for FIXED_AMOUNT would collect a rule the
              checkout ignores. */}
          {isPercentage && (
            <div className="space-y-1.5">
              <Label htmlFor="coupon-cap">Cap the discount at (₦)</Label>
              <Input
                id="coupon-cap"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                placeholder="Optional"
                value={values.maxDiscountAmount}
                onChange={(e) => set("maxDiscountAmount", e.target.value)}
                aria-invalid={!!errors.maxDiscountAmount}
                aria-describedby={
                  errors.maxDiscountAmount ? "coupon-cap-error" : undefined
                }
              />
              <FieldNote id="coupon-cap-error" error={errors.maxDiscountAmount}>
                The ceiling on one redemption, however large the cart. Without
                it, a percentage off a laptop order is unbounded.
              </FieldNote>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="coupon-min">Minimum cart (₦)</Label>
            <Input
              id="coupon-min"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              placeholder="Optional"
              value={values.minOrderAmount}
              onChange={(e) => set("minOrderAmount", e.target.value)}
              aria-invalid={!!errors.minOrderAmount}
              aria-describedby={
                errors.minOrderAmount ? "coupon-min-error" : undefined
              }
            />
            <FieldNote id="coupon-min-error" error={errors.minOrderAmount}>
              Measured against the subtotal, before tax and delivery.
            </FieldNote>
          </div>
        </div>
      </section>

      {/* ── The limits ─────────────────────────────────────────────────── */}
      <section className="space-y-4 border-t border-border pt-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="coupon-max-uses">Total redemptions</Label>
            <Input
              id="coupon-max-uses"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              placeholder="Unlimited"
              value={values.maxUsageCount}
              onChange={(e) => set("maxUsageCount", e.target.value)}
              aria-invalid={!!errors.maxUsageCount}
              aria-describedby={
                errors.maxUsageCount ? "coupon-max-uses-error" : undefined
              }
            />
            <FieldNote id="coupon-max-uses-error" error={errors.maxUsageCount}>
              Across every customer. Leave blank for no ceiling.
            </FieldNote>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="coupon-per-user">Per customer</Label>
            <Input
              id="coupon-per-user"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={values.maxUsagePerUser}
              onChange={(e) => set("maxUsagePerUser", e.target.value)}
              aria-invalid={!!errors.maxUsagePerUser}
              aria-describedby={
                errors.maxUsagePerUser ? "coupon-per-user-error" : undefined
              }
            />
            <FieldNote
              id="coupon-per-user-error"
              error={errors.maxUsagePerUser}
            >
              How many times one person may use this code. One order can only
              ever carry one coupon.
            </FieldNote>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="coupon-expires">Expires</Label>
          <Input
            id="coupon-expires"
            type="datetime-local"
            value={values.expiresAt}
            onChange={(e) => set("expiresAt", e.target.value)}
            aria-invalid={!!errors.expiresAt}
            aria-describedby={
              errors.expiresAt ? "coupon-expires-error" : undefined
            }
          />
          <FieldNote id="coupon-expires-error" error={errors.expiresAt}>
            {mode === "edit" && coupon?.expiresAt
              ? "An expiry can be moved, but the API has no way to remove one once set."
              : "Leave blank for a code that never expires on its own."}
          </FieldNote>
        </div>
      </section>

      {/* ── Going live ─────────────────────────────────────────────────── */}
      {mode === "create" && (
        <section className="space-y-1.5 border-t border-border pt-6">
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="coupon-live"
              className="mt-0.5"
              checked={values.liveOnCreate}
              onCheckedChange={(checked) =>
                set("liveOnCreate", checked === true)
              }
            />
            <div className="space-y-0.5">
              <Label htmlFor="coupon-live" className="font-normal">
                Make it live as soon as I save
              </Label>
              <p className="text-xs text-muted-foreground">
                There is no scheduled start — a code is either live or switched
                off. Uncheck this to set the code up now and switch it on when
                the promotion actually starts.
              </p>
            </div>
          </div>
        </section>
      )}

      <CouponOfferPreview values={values} />

      <div className="flex items-center gap-3 border-t border-border pt-6">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <AppIcon
                icon="solar:refresh-linear"
                className="size-4 animate-spin"
              />
              Saving…
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}

/**
 * One slot under a field, holding either the hint or the complaint — never
 * both. Stacking an error under a hint makes the row taller mid-form and
 * leaves the reader deciding which line is current.
 */
function FieldNote({
  id,
  error,
  children,
}: {
  id?: string;
  error?: string;
  children?: React.ReactNode;
}) {
  if (error) {
    return (
      <p
        id={id}
        role="alert"
        className="text-xs font-semibold text-destructive-ink"
      >
        {error}
      </p>
    );
  }
  if (!children) return null;
  return <p className="text-xs text-muted-foreground">{children}</p>;
}
