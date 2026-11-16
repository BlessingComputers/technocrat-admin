import { Section, Path, Callout, FieldTable } from "./doc-kit";

/**
 * "Running a treasure hunt" guide for `/pricing/hunts`.
 *
 * The unpaid-winner section matches the backend, not the original design: the
 * design said a claim is permanent, and the backend releases an unpaid hold
 * after 15 minutes. Staff who read the old version would phone too late.
 *
 * Presentation-only, composes from the Doc Kit.
 */
export function RunningTreasureHuntsDoc() {
  return (
    <>
      <Section icon="solar:gift-linear" title="What a hunt is">
        <p>
          A hunt runs over a public window, such as noon to four on a Saturday.
          It carries a few items, announced in advance with their hunt prices.
          What stays secret is when each one drops. At unannounced moments inside
          the window, one item goes live at its hunt price for five minutes.
        </p>
        <p>
          Each item has one unit. The first customer to submit an order takes it.
          Winners collect in store, and there is no delivery.
        </p>
        <Path items={["Pricing", "Hunts"]} />
      </Section>

      <Section
        icon="solar:tag-price-linear"
        title="Setting prices"
        subtitle="You type naira. The system stores a percentage."
      >
        <FieldTable
          rows={[
            [
              "Naira in, percentage stored",
              "The form turns your price into a discount with two decimal places, so a large price can land a few naira off what you typed. The form shows the real figure.",
            ],
            [
              "The cheapest variant",
              "The hunt price is worked out from the product's cheapest variant. Other variants get the same percentage off.",
            ],
            [
              "Drift",
              "The discount is fixed, so the hunt price moves if you change the base price. Recheck prices after you change a base price.",
            ],
            [
              "One rule per product",
              "A product holds one pricing rule at a time. A markup rule or a deal on the product stops the drop from starting, and the item then sells at its normal price. The form warns you.",
            ],
          ]}
        />
      </Section>

      <Section icon="solar:eye-closed-linear" title="Keeping the schedule secret">
        <p>
          Customers see the window and the items. They never see a drop time. Each
          drop shows publicly only as a countdown, from its reveal time.
        </p>
        <Callout tone="warn" title="Do not share the campaign page">
          The campaign page shows every drop time. Do not screenshot it for
          social, and do not tell customers the times.
        </Callout>
      </Section>

      <Section
        icon="solar:clock-circle-linear"
        title="When a winner does not pay"
        subtitle="The clock is 15 minutes, and it runs by itself."
      >
        <p>
          A winner&apos;s order holds the item for 15 minutes. The campaign page
          shows the release time on the row. A phone call only helps before that
          time. After it, the system releases the item by itself, and if the slot
          has closed the item stays unsold.
        </p>
        <p>
          If a payment fails, the release is immediate. Inside the slot, the item
          goes live again for everyone.
        </p>
        <Callout tone="note" title="When to release by hand">
          Use <b>Release</b> for a claim that is paid but that we cannot fulfil.
          Inside the slot, the item goes live again for everyone right now. After
          the slot, it will not drop again. Release does not cancel the order or
          refund the customer, so do that on the order page.
        </Callout>
      </Section>

      <Section icon="solar:danger-triangle-linear" title="Stale campaigns">
        <p>
          The public page shows the earliest campaign that is still Scheduled or
          Active. A Scheduled campaign whose window has passed can hide a newer
          one. The list flags it with a warning.
        </p>
        <Callout tone="warn" title="Delete it if nobody claimed anything">
          Open the campaign and press <b>Delete</b>, then type its name to confirm.
          The Delete button is hidden while any drop has a holder, because that
          would lose the record of who won.
        </Callout>
      </Section>
    </>
  );
}
