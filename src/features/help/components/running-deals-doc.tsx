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
 * "Running Deals" walkthrough (ADR-0012) for `/pricing/deals`. The sale half of
 * pricing, split out of the markup guide when `/pricing` became three routes
 * (`0015-nav-groups-and-pricing-routes`, in the Blessing repo; the two
 * apps' ADR numbers diverged).
 *
 * Four things staff get wrong if the doc doesn't say them plainly: a saved deal
 * can't be edited or deleted; starting is a manual act and nothing moves before
 * it; the clock is a five-minute sweep, not a stopwatch; and blocking coupons
 * blocks them on the whole basket. Each has its own callout.
 *
 * Presentation-only, composes from the Doc Kit.
 */
export function RunningDealsDoc() {
  return (
    <>
      {/* Intro */}
      <Section icon="solar:sale-linear" title="Putting things on sale">
        <p>
          A <b>deal</b> is a named sale: a percentage off any mix of products and
          parts, running until you end it or until the end time you set. Shoppers
          see the name you give it, so write it for them.
        </p>
        <p>
          Under the surface a deal is the same setting as a markup rule with a
          minus in front of it. That is why the two screens are neighbours, and
          why a deal and a markup can never cover the same thing at once.
        </p>
        <Path items={["Pricing", "Deals"]} />
        <Callout tone="note" title="Standing prices live next door">
          Permanent pricing policy, the percentage you add on top of cost all
          year round, is <b>Pricing &rsaquo; Markup</b>. Use a deal for something
          with an end in mind.
        </Callout>
      </Section>

      {/* Lifecycle: bento overview */}
      <Section
        icon="solar:routing-2-linear"
        title="The life of a deal"
        subtitle="Draft it, start it, run it, end it."
      >
        <Bento>
          <StepCard
            n={1}
            span={5}
            tone="muted"
            bgIcon="solar:add-circle-linear"
            title="Save it as a draft"
          >
            <p>
              Name the sale, list what it covers, set the discount. Saving does{" "}
              <b>not</b> change a single price.
            </p>
          </StepCard>

          <StepCard
            n={2}
            span={7}
            tone="inverted"
            bgIcon="solar:play-circle-linear"
            title="Start it yourself, when you're ready"
          >
            <p>
              Nothing happens until you press <b>Start deal</b> on the deal&apos;s
              own page. That is the moment prices drop.
            </p>
            <ul className="mt-3 space-y-2">
              <StepPoint dark icon="solar:check-circle-linear">
                Every target it managed to apply is listed
              </StepPoint>
              <StepPoint dark icon="solar:danger-triangle-linear">
                Anything it had to skip is listed too, with the reason
              </StepPoint>
            </ul>
          </StepCard>

          <StepCard
            n={3}
            span={7}
            tone="jewel"
            bgIcon="solar:hourglass-linear"
            title="It runs"
          >
            <p>
              The sale price shows on the storefront. If you gave it an end time
              the shop closes it for you; if you didn&apos;t, it runs until you
              say stop.
            </p>
          </StepCard>

          <StepCard
            n={4}
            span={5}
            tone="muted"
            bgIcon="solar:stop-circle-linear"
            title="End it"
          >
            <p>
              <b>End deal</b> puts every price it touched back to base. A deal
              ends once and for good.
            </p>
          </StepCard>
        </Bento>
      </Section>

      {/* Create */}
      <Section
        icon="solar:add-circle-linear"
        title="Creating a deal"
        subtitle="One page: the name, the coupon rule, and the list of what's on sale."
      >
        <Path items={["Pricing", "Deals", "New deal"]} />
        <Steps
          steps={[
            {
              title: "Name it for shoppers",
              body: "“Weekend Laptop Sale”, not “Q3 clearance batch 2”. This name is shown on the storefront. There's a separate internal notes box further down for anything only staff should read.",
            },
            {
              title: "Set an end time, or don't",
              body: "Optional. Leave it empty and the deal runs until you end it by hand. Whatever you set applies to everything in the deal, so you can't end one item early.",
            },
            {
              title: "Decide about discount codes",
              body: "Two choices, explained below. The default blocks codes.",
            },
            {
              title: "List what's on sale",
              body: "Add a row per target. Each row is either one specific product or part, searched by name, or a whole category, brand or part type. Products and parts can be mixed in the same deal, up to 100 rows.",
            },
            {
              title: "Set the discount",
              body: "“Same discount for every target” is ticked by default: type one percentage and it applies to the lot. Untick it to set a different percentage per row. Between 1% and 90%.",
            },
            {
              title: "Save draft",
              body: "The deal is created and you land on its page. Still no price has moved.",
            },
          ]}
        />
        <Callout tone="warn" title="A saved deal can't be edited or deleted">
          There is no Edit button and no delete, for drafts or anything else.
          Check the name and the rows before you save. If you got something wrong,
          leave the draft unstarted (it changes nothing) and create a new one.
        </Callout>
      </Section>

      {/* Naming and targets */}
      <Section
        icon="solar:list-linear"
        title="Names, notes and rows"
        subtitle="Three bits of text that go to three different places."
      >
        <FieldTable
          rows={[
            [
              "Deal name",
              "Shown to shoppers on the storefront. Also how you'll recognise the deal in the list here.",
            ],
            [
              "Internal notes",
              "Staff only, never shown to shoppers. Use it for why the sale is running or who signed it off.",
            ],
            [
              "Each row",
              "Carries what it covers and its percentage. When you pick a specific product or part, its name is kept with the row so the deal's page can show it without you looking it up.",
            ],
          ]}
        />
        <Callout tone="tip" title="One sale, one deal">
          You don&apos;t need a deal per product. A single deal takes up to 100
          rows across both catalogues, and it starts, runs and ends as one thing,
          which is far easier to keep track of than twelve separate ones.
        </Callout>
      </Section>

      {/* Coupons */}
      <Section
        icon="solar:ticket-linear"
        title="Discount codes on a deal"
        subtitle="The one setting whose effect reaches outside the sale."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MiniCard
            icon="solar:check-circle-linear"
            title="Shoppers can still use a code"
          >
            A discount code applies on top of the sale price. Choose this when the
            sale is small enough that you can absorb a code as well.
          </MiniCard>
          <MiniCard icon="solar:close-circle-linear" title="Block discount codes">
            The default. Stops a code being stacked on the sale price.
          </MiniCard>
        </div>
        <Callout tone="warn" title="Blocking is basket-wide, not item-wide">
          If you block codes, a shopper with <b>anything this deal covers</b> in
          their basket can&apos;t use a code <b>on the whole basket</b>, including
          the items that aren&apos;t on sale. A deal over a broad category can
          therefore switch coupons off for most of the shop. Bear that in mind if
          a campaign is running.
        </Callout>
      </Section>

      {/* Starting */}
      <Section
        icon="solar:play-circle-linear"
        title="Starting a deal"
        subtitle="The one action that moves prices."
      >
        <Path items={["Pricing", "Deals", "Open the deal", "Start deal"]} />
        <Steps
          steps={[
            {
              title: "Open the deal from the list",
              body: "The list filters by status: Draft, Scheduled, Active, Ended. A draft is one you haven't started.",
            },
            {
              title: "Check the target table",
              body: "Everything the deal covers, one row each, with its discount. A row showing a warning already has another rule on it. See below.",
            },
            {
              title: "Press Start deal and confirm",
              body: "Prices change immediately. The toast tells you how many targets went live.",
            },
            {
              title: "Read the table again",
              body: "“Live rules” at the top says how many of the targets actually applied. If any were skipped, the table marks them and says why.",
            },
          ]}
        />
        <Callout tone="warn" title="A deal can start with some rows skipped">
          Starting doesn&apos;t fail as a whole. If three of twelve rows clash
          with something, the other nine go live and the deal reads Active. Always
          check the count after starting: it is shown on the page right after, and
          the numbers stay on the page afterwards even if the detail of which rows
          failed does not survive a reload.
        </Callout>
      </Section>

      {/* Clashes */}
      <Section
        icon="solar:graph-up-linear"
        title="When a markup is already on the same products"
        subtitle="A row can only be warned about, not fixed for you."
      >
        <p>
          Only one rule can sit on a given product, or a given category and brand
          pair. So a row pointing at something a markup rule already covers can
          only be applied by taking that markup&apos;s place.
        </p>
        <p>
          As you build each row, the form checks and shows a warning naming what
          is already there and at what percentage. It does <b>not</b> stop you
          saving. A draft is harmless, and you may well intend to clear the markup
          first.
        </p>
        <Callout tone="tip" title="Clear the clash before you start">
          Go to <b>Pricing &rsaquo; Markup</b>, and cancel or delete the rule in
          the way, then come back and start the deal. Starting a deal over a clash
          just skips that row.
        </Callout>
      </Section>

      {/* Timing */}
      <Section
        icon="solar:clock-circle-linear"
        title="End times and the five-minute sweep"
        subtitle="The shop checks the clock on a cycle, not to the second."
      >
        <p>
          The shop looks for deals that should start or finish{" "}
          <b>every five minutes</b>. So a deal set to end at 17:00 can still be
          showing its sale price at 17:03, and its status can still read Active
          while the end time has passed. That is normal and it corrects itself on
          the next pass.
        </p>
        <FieldTable
          rows={[
            ["Draft", "Created but never started. No price has changed."],
            [
              "Scheduled",
              "Waiting for a start time to come round. The sweep starts it.",
            ],
            [
              "Active",
              "Running now. Sale prices are live on the storefront.",
            ],
            [
              "Ended",
              "Finished, by hand or by its end time. Prices are back to base and it can't be restarted.",
            ],
          ]}
        />
        <Callout tone="note" title="Don't chase an exact minute">
          If a sale has to stop at a precise moment, say the end of a flash promo,
          end it by hand rather than trusting the end time to the minute.
        </Callout>
      </Section>

      {/* Ending */}
      <Section icon="solar:stop-circle-linear" title="Ending a deal">
        <p>
          <b>End deal</b> on the deal&apos;s page puts every product and part it
          repriced back to its base price and closes the deal. The toast confirms
          how many of each were reset.
        </p>
        <Callout tone="warn" title="Ending is final">
          An ended deal can&apos;t be restarted. To run the same sale again,
          create a new deal. Nothing is lost: the ended one stays in the list for
          the record.
        </Callout>
        <Callout tone="note" title="Prices go back to base, not to their old markup">
          Ending resets to the base price. If a markup rule should be pricing
          those products afterwards, check <b>Pricing &rsaquo; Markup</b> and apply
          it again.
        </Callout>
      </Section>

      {/* Parts */}
      <Section
        icon="solar:layers-minimalistic-linear"
        title="Parts in a deal"
      >
        <p>
          Parts work exactly like products here. Each row has a Product / Part
          toggle, and one deal can hold both. A part row can be scoped to a{" "}
          <b>part type</b> as well as a category or brand.
        </p>
        <Callout tone="tip" title="The toggle is sticky">
          Adding a new row copies the last row&apos;s choice, so a deal over eight
          parts doesn&apos;t need eight clicks on the Part toggle.
        </Callout>
      </Section>
    </>
  );
}
