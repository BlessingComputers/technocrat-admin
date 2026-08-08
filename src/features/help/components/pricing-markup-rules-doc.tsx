import {
  Section,
  Path,
  Steps,
  StepCard,
  StepPoint,
  Bento,
  MiniCard,
  Callout,
} from "./doc-kit";

/**
 * "Pricing & Markup Rules" walkthrough (ADR-0012) for the Products tab of
 * `/pricing`. Explains percentage rules scoped by category + brand, and the
 * preview → apply → reset lifecycle. Bento overview then vertical spine detail.
 * Written for non-technical staff; presentation-only, composes from the Doc Kit.
 */
export function PricingMarkupRulesDoc() {
  return (
    <>
      {/* Intro */}
      <Section icon="solar:tag-price-linear" title="Pricing products in bulk">
        <p>
          Instead of pricing every product by hand, a <b>markup rule</b> adds (or
          takes off) a percentage across a whole group at once — &ldquo;add 20% to
          all HP laptops&rdquo;. You set the rule, preview exactly what it would
          change, then apply it.
        </p>
        <p>
          Rules live on the <b>Pricing</b> page. It has a <b>Products</b> tab and a{" "}
          <b>Parts</b> tab (and a Tax tab if you manage tax) — they work the same
          way; this guide follows Products.
        </p>
        <Path items={["Catalogue", "Markup Rules"]} />
      </Section>

      {/* The lifecycle — bento overview */}
      <Section
        icon="solar:routing-2-linear"
        title="How a rule works, start to finish"
        subtitle="Build it, preview it, apply it — and undo it if you need to."
      >
        <Bento>
          <StepCard
            n={1}
            span={5}
            tone="muted"
            bgIcon="solar:add-circle-linear"
            title="Build the rule"
          >
            <p>
              Choose what it covers — a <b>category</b>, a <b>brand</b>, or both —
              pick <b>Markup</b> or <b>Discount</b>, and enter the percentage.
            </p>
          </StepCard>

          <StepCard
            n={2}
            span={7}
            tone="inverted"
            bgIcon="solar:eye-linear"
            title="Preview before anything changes"
          >
            <p>
              Nothing is repriced until you say so. Preview shows exactly what
              happens:
            </p>
            <ul className="mt-3 space-y-2">
              <StepPoint dark icon="solar:box-linear">
                How many products &amp; variants are affected
              </StepPoint>
              <StepPoint dark icon="solar:tag-price-linear">
                Each current price next to its new price
              </StepPoint>
            </ul>
          </StepCard>

          <StepCard
            n={3}
            span={7}
            tone="gold"
            bgIcon="solar:check-circle-linear"
            title="Apply it"
          >
            <p>
              Happy with the preview? <b>Apply</b> writes the new prices. Prices
              never drop below cost, and new matching products pick the rule up
              automatically from then on.
            </p>
          </StepCard>

          <StepCard
            n={4}
            span={5}
            tone="muted"
            bgIcon="solar:refresh-linear"
            title="Undo if needed"
          >
            <p>
              Changed your mind? <b>Reset</b> prices back to base, or <b>Cancel</b>{" "}
              the rule entirely — both are one click away.
            </p>
          </StepCard>
        </Bento>
      </Section>

      {/* Create a rule */}
      <Section
        icon="solar:add-circle-linear"
        title="Creating a rule"
        subtitle="Scope it, set the percentage, preview, save."
      >
        <Path items={["Pricing", "Products", "New Rule"]} />
        <Steps
          steps={[
            {
              title: 'Click "New Rule"',
              body: "On the Products tab of the Pricing page, click New Rule.",
            },
            {
              title: "Choose the scope",
              body: "Pick a Category, a Brand, or both. Leaving one as “All” makes the rule broader — e.g. All categories + HP means every HP product.",
            },
            {
              title: "Pick direction & percentage",
              body: "Choose Markup (increase the price) or Discount (reduce it), then type the percentage. You only ever type a positive number — the toggle sets the direction.",
            },
            {
              title: "Preview inside the form",
              body: 'Click Preview to see how many active products it would reprice and a sample of the new prices — nothing is saved yet.',
            },
            {
              title: "Add a note & save",
              body: "Optionally jot why the rule exists, leave it Active, and Create Rule. Creating a rule does NOT reprice existing products on its own — that's the next step.",
            },
          ]}
        />
        <Callout tone="note" title="Scope is fixed once created">
          The category + brand a rule covers can&apos;t be changed later — only its
          percentage, note, and active switch. If you need a different scope,
          create a new rule.
        </Callout>
      </Section>

      {/* Apply */}
      <Section
        icon="solar:check-circle-linear"
        title="Applying a rule to existing products"
        subtitle="The preview is your review step."
      >
        <Path items={["Pricing", "Products", "Preview & apply"]} />
        <Steps
          steps={[
            {
              title: "Open Preview & apply",
              body: "Find the rule in the table and choose Preview & apply. A dry-run runs automatically.",
            },
            {
              title: "Review the projected prices",
              body: "You'll see every affected variant with its current price, the projected new price, and the resulting margin. Green means the price went up, red means down.",
            },
            {
              title: "Apply",
              body: 'Click Apply to write those prices. A toast confirms how many were repriced.',
            },
          ]}
        />
        <Callout tone="tip" title="Prices never go below cost">
          Apply protects your margin — a variant is never repriced below what it
          cost you, even if the percentage would push it there.
        </Callout>
        <Callout tone="warn" title="There's a limit on applies">
          To protect the catalogue, you can apply at most <b>10 times per 10
          minutes</b>. If you hit the limit, wait a few minutes and try again.
        </Callout>
      </Section>

      {/* Undo */}
      <Section icon="solar:refresh-linear" title="Resetting & cancelling">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MiniCard icon="solar:refresh-linear" title="Reset prices">
            Puts affected prices back to base but keeps the rule <b>active</b> — so
            new products and edits will pick the markup up again, and prices drift
            back over time.
          </MiniCard>
          <MiniCard icon="solar:close-circle-linear" title="Cancel & reset">
            Resets prices to base <b>and</b> switches the rule off. This is the
            proper, lasting undo. The rule is kept for the record.
          </MiniCard>
          <MiniCard icon="solar:trash-bin-trash-linear" title="Delete">
            Removes the rule. Prices it already changed are <b>not</b> reverted —
            reset or cancel first if you want them back to base.
          </MiniCard>
        </div>
        <Callout tone="note" title="Reset the whole category at once">
          The header has a <b>Reset category prices</b> action for putting an
          entire category (optionally narrowed by brand) back to base in one go —
          handy for a clean slate before re-pricing.
        </Callout>
      </Section>

      {/* Parts pointer */}
      <Section icon="solar:layers-minimalistic-linear" title="Pricing parts">
        <p>
          Parts price the same way — switch to the <b>Parts</b> tab on the Pricing
          page. Everything in this guide applies: scope by category and brand,
          preview, apply, and reset.
        </p>
        <Path items={["Pricing", "Parts"]} />
      </Section>
    </>
  );
}
