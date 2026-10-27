import {
  Section,
  Path,
  Steps,
  StepCard,
  StepPoint,
  Bento,
  MiniCard,
  Callout,
  FieldTable,
} from "./doc-kit";

/**
 * "Markup Rules" walkthrough (ADR-0012) for `/pricing/markup`. Standing pricing
 * policy only: what a rule is, how one target wins over another, preview →
 * apply, and the three different undos. Sales moved out to the Deals guide when
 * `/pricing` split into three routes (`0015-nav-groups-and-pricing-routes`,
 * in the Blessing repo), so this doc no longer mentions a Discount direction or
 * an expiry — neither exists on this screen any more.
 * Bento overview then vertical spine detail. Written for non-technical staff;
 * presentation-only, composes from the Doc Kit.
 */
export function PricingMarkupRulesDoc() {
  return (
    <>
      {/* Intro */}
      <Section icon="solar:graph-up-linear" title="Pricing products in bulk">
        <p>
          Instead of pricing every product by hand, a <b>markup rule</b> adds a
          percentage across a whole group at once, like &ldquo;add 20% to all HP
          laptops&rdquo;. You set the rule, preview exactly what it would change,
          then apply it.
        </p>
        <p>
          A markup is your <b>standing price policy</b>. It is meant to sit there
          for months, and anything matching it picks it up from then on, including
          products you add later.
        </p>
        <Path items={["Pricing", "Markup"]} />
        <Callout tone="note" title="A sale is not a markup rule">
          Temporary price drops live on their own screen, under{" "}
          <b>Pricing &rsaquo; Deals</b>, and they do not appear in the table here.
          Everything on this page stays until you change it.
        </Callout>
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
              Choose what it covers — one <b>product</b>, or a <b>category</b>{" "}
              and/or <b>brand</b> — and enter the percentage to add.
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
            tone="jewel"
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
        <Path items={["Pricing", "Markup", "New Rule"]} />
        <Steps
          steps={[
            {
              title: 'Click "New Rule"',
              body: "On Pricing › Markup, with Products selected, click New Rule.",
            },
            {
              title: "Choose what it covers",
              body: "Either one specific product, searched by name, or a Category and Brand combination. Leaving one of those as “All” makes the rule broader — All categories + HP means every HP product.",
            },
            {
              title: "Type the percentage",
              body: "How much to add on top. It is always a positive number: this screen only ever puts prices up. A price cut is a deal, and deals are created under Pricing › Deals.",
            },
            {
              title: "Preview inside the form",
              body: "Click Preview to see how many active products it would reprice and a sample of the new prices. Nothing is saved yet.",
            },
            {
              title: "Add a note & save",
              body: "Optionally jot why the rule exists, leave it Active, and Create Rule. Creating a rule does NOT reprice existing products on its own — that's the next step.",
            },
          ]}
        />
        <Callout tone="note" title="Scope is fixed once created">
          What a rule covers can&apos;t be changed later, only its percentage,
          note, and active switch. If you need a different scope, create a new
          rule.
        </Callout>
        <Callout tone="warn" title="One rule per scope, on or off">
          Two rules can&apos;t sit on the same product, or the same category and
          brand pair. If one is already there the form says so and won&apos;t let
          you save, <b>even if that rule is switched off</b>. Edit the existing
          rule instead, or pick a narrower scope.
        </Callout>
      </Section>

      {/* Which rule wins */}
      <Section
        icon="solar:list-linear"
        title="Which rule a product actually gets"
        subtitle="Only one rule ever applies. The most specific match wins."
      >
        <p>
          Rules overlap on purpose: a broad one for a whole category, a tighter
          one for a brand inside it. A product is never marked up twice. The shop
          looks for a match in this order and <b>stops at the first one it
          finds</b>:
        </p>
        <FieldTable
          rows={[
            [
              "1. That exact product",
              "A rule created against the single product beats everything else.",
            ],
            [
              "2. Category + brand",
              "Checked from the product's own subcategory upwards through its parents, so a rule on “Gaming Laptops + HP” beats one on “Laptops + HP”.",
            ],
            [
              "3. Brand on its own",
              "A rule with the category left as “All” — every product of that brand, wherever it is filed.",
            ],
            [
              "4. Category on its own",
              "A rule with the brand left as “All”, again walking up from the subcategory to its parents.",
            ],
          ]}
        />
        <Callout tone="tip" title="Use this rather than fighting it">
          Set your general policy on the category, then override individual
          brands or products where the margin differs. You don&apos;t need to
          switch the broad rule off.
        </Callout>
        <Callout tone="note" title="Switched-off rules are skipped">
          Only <b>active</b> rules take part in the matching above. A deactivated
          rule is invisible to pricing, but it still holds its scope, so nothing
          new can be created on top of it.
        </Callout>
      </Section>

      {/* Apply */}
      <Section
        icon="solar:check-circle-linear"
        title="Applying a rule to existing products"
        subtitle="The preview is your review step."
      >
        <Path items={["Pricing", "Markup", "Preview & apply"]} />
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
              body: "Click Apply to write those prices. A toast confirms how many were repriced.",
            },
          ]}
        />
        <Callout tone="tip" title="Prices never go below cost">
          Apply protects your margin: a variant is never repriced below what it
          cost you, even if the percentage would push it there.
        </Callout>
        <Callout tone="warn" title="There's a limit on applies">
          To protect the catalogue, you can apply at most <b>10 times per 10
          minutes</b>. If you hit the limit, wait a few minutes and try again.
        </Callout>
      </Section>

      {/* A deal on the same target */}
      <Section
        icon="solar:sale-linear"
        title="When a sale is already on the same products"
        subtitle="A deal and a markup are the same setting, pulling opposite ways."
      >
        <p>
          A running deal takes the same slot a markup would. So if you build a
          markup that lands on products a sale is currently covering, saving it{" "}
          <b>ends that sale</b> and the prices jump back up immediately, in front
          of any shopper who is mid-basket.
        </p>
        <p>
          The form checks for this before you save. When something is already
          there you get a panel naming it and the percentage it is running at, and
          the save button changes to say what it is about to do.
        </p>
        <Callout tone="warn" title="Read the panel before you save">
          The warning is your only notice. Nothing on this screen lists running
          sales, and once the deal has ended there is no undo button. If the sale
          should keep running, go to <b>Pricing &rsaquo; Deals</b> first and check
          what it covers.
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
          entire category (optionally narrowed by brand) back to base in one go,
          handy for a clean slate before re-pricing.
        </Callout>
        <Callout tone="tip" title="Cancel, don't delete, if you might want it back">
          Cancelling frees nothing: the rule keeps its scope, so it still blocks a
          new rule on the same products. Delete is what frees the scope, and it
          leaves the prices where they are.
        </Callout>
      </Section>

      {/* Parts pointer */}
      <Section icon="solar:layers-minimalistic-linear" title="Pricing parts">
        <p>
          Parts price the same way. Switch the toggle at the top of the Markup
          page from <b>Products</b> to <b>Parts</b>. Everything in this guide
          applies: scope it, preview, apply, and reset. Part rules can also be
          scoped by <b>part type</b>, which products have no equivalent of.
        </p>
        <Path items={["Pricing", "Markup", "Parts"]} />
      </Section>
    </>
  );
}
