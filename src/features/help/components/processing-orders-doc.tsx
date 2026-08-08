import {
  Section,
  Path,
  Steps,
  StepCard,
  StepPoint,
  Bento,
  Tile,
  MiniCard,
  Callout,
} from "./doc-kit";

/**
 * "Processing Orders" walkthrough (ADR-0012). Covers the unified `/orders` queue
 * and both order flows — gateway (paid online) and bank transfer (manual, with a
 * proof to verify) — in one guide with clear Section divisions, per the ADR's
 * "one flow per slug, split by genuine job" rule. Bento overview then vertical
 * spine detail. Written for non-technical staff; composes from the Doc Kit.
 */
export function ProcessingOrdersDoc() {
  return (
    <>
      {/* Intro */}
      <Section icon="solar:cart-large-2-linear" title="The orders queue">
        <p>
          <b>Orders</b> is where every sale lands, whatever way the customer paid.
          Your job is to work each one through — check the payment, prepare the
          goods, get them to the customer, and mark it done.
        </p>
        <p>
          Orders come from two places, and the difference matters mostly for{" "}
          <b>payment</b>:
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Tile
            icon="solar:card-linear"
            tone="navy"
            title="Gateway"
            body="Paid online through the payment gateway. The money's already in — you go straight to fulfilling it."
          />
          <Tile
            icon="solar:buildings-3-linear"
            tone="primary"
            title="Bank Transfer"
            body="Customer paid by bank transfer and uploaded a receipt. You verify that proof before fulfilling."
          />
        </div>
        <Path items={["Sidebar", "Orders"]} />
      </Section>

      {/* Lifecycle — bento overview */}
      <Section
        icon="solar:routing-2-linear"
        title="An order, start to finish"
        subtitle="The same shape for every order — with one extra step for bank transfers."
      >
        <Bento>
          <StepCard
            n={1}
            span={5}
            tone="muted"
            bgIcon="solar:cart-large-2-linear"
            title="Find it in the queue"
          >
            <p>
              Search or filter the list, spot whether it&apos;s Gateway or Bank
              Transfer from its badge, and open it.
            </p>
          </StepCard>

          <StepCard
            n={2}
            span={7}
            tone="inverted"
            bgIcon="solar:shield-check-linear"
            title="Check the payment"
          >
            <ul className="mt-1 space-y-2">
              <StepPoint dark icon="solar:card-linear">
                <b>Gateway:</b> already paid — nothing to do here
              </StepPoint>
              <StepPoint dark icon="solar:buildings-3-linear">
                <b>Bank transfer:</b> open the receipt and confirm (or reject) it
              </StepPoint>
            </ul>
          </StepCard>

          <StepCard
            n={3}
            span={7}
            tone="card"
            bgIcon="solar:delivery-linear"
            title="Prepare & fulfil"
          >
            <p>
              Move the order along its status — preparing, then out for delivery
              (assigning a rider) or ready for pick-up.
            </p>
          </StepCard>

          <StepCard
            n={4}
            span={5}
            tone="gold"
            bgIcon="solar:check-circle-linear"
            title="Complete it"
          >
            <p>
              Once the customer has the goods, mark the order complete. Done.
            </p>
          </StepCard>
        </Bento>
      </Section>

      {/* The list */}
      <Section
        icon="solar:magnifer-linear"
        title="Finding an order"
        subtitle="One list for both kinds of order."
      >
        <p>
          The queue lists gateway and bank-transfer orders together, each with a{" "}
          <b>source badge</b> so you can tell them apart at a glance. Narrow it down
          to find what you need:
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MiniCard icon="solar:magnifer-linear" title="Search">
            By order number, customer name, or email.
          </MiniCard>
          <MiniCard icon="solar:card-linear" title="Source">
            Show only Gateway, only Bank Transfer, or all.
          </MiniCard>
          <MiniCard icon="solar:filter-linear" title="Status & more">
            Filter by order status, and open Advanced Filters for payment status
            and sorting.
          </MiniCard>
        </div>
        <Callout tone="tip" title="Start with “Pending Review”">
          Filtering the status to <b>Pending Review</b> surfaces the bank-transfer
          orders waiting on you to check a receipt — usually the most urgent work
          in the queue.
        </Callout>
      </Section>

      {/* Verify payment */}
      <Section
        icon="solar:shield-check-linear"
        title="Verifying a bank-transfer payment"
        subtitle="Only for bank-transfer orders with an uploaded receipt."
      >
        <p>
          When a customer pays by transfer, they upload a receipt as{" "}
          <b>proof of payment</b>. The order shows a <b>Payment Verification</b>{" "}
          panel — your job is to check the receipt against what&apos;s owed, then
          confirm or reject it. (Gateway orders skip this entirely — they&apos;re
          already paid.)
        </p>
        <Path items={["Orders", "Open a bank-transfer order", "Payment Verification"]} />
        <Steps
          steps={[
            {
              title: "Open the receipt",
              body: "The customer's proof is shown next to the order totals. Click it to view it full-screen, or use “View Original” to open the file.",
            },
            {
              title: "Check it against the expected total",
              body: "Compare the amount and reference on the receipt with the Expected Total (subtotal + shipping) shown beside it.",
            },
            {
              title: "Confirm the payment",
              body: "If it's good, click Confirm Payment. The confirmed amount is pre-filled to the expected total — adjust it if they paid a different amount — and add an internal note if useful. This marks the order paid so you can fulfil it.",
            },
            {
              title: "…or reject the proof",
              body: "If the receipt is unclear or wrong, click Reject Proof and write a reason. The reason is sent to the customer, so be clear about what they need to fix and re-upload.",
            },
          ]}
        />
        <Callout tone="warn" title="The rejection reason reaches the customer">
          Whatever you type as the rejection reason is shown to the customer — keep
          it polite and specific (&ldquo;the amount isn&apos;t visible, please send
          a clearer receipt&rdquo;), not blunt shorthand.
        </Callout>
      </Section>

      {/* Fulfil */}
      <Section
        icon="solar:delivery-linear"
        title="Fulfilling an order"
        subtitle="Moving it from paid to delivered."
      >
        <p>
          Once an order is paid (verified, or paid online), you move it through its{" "}
          <b>fulfilment status</b> as you prepare and deliver it. Each change can
          carry a note, and the whole history is recorded on the order.
        </p>
        <Path items={["Open an order", "Fulfilment Status", "Next status"]} />
        <Steps
          steps={[
            {
              title: "Mark it preparing",
              body: "Set the status to Preparing Order (Processing) once you start putting it together.",
            },
            {
              title: "For delivery: assign a rider",
              body: "If it's going out for delivery, choose Assign Rider and enter the rider's name and phone, then move it to Out for Delivery when it leaves.",
            },
            {
              title: "For pick-up: hand it over",
              body: "If the customer collects in store, there's no rider — just complete the order when they've picked it up.",
            },
            {
              title: "Mark it delivered / complete",
              body: "Set Delivered when it arrives, then Complete Order to close it out. Add a fulfilment note if there's anything worth recording.",
            },
          ]}
        />
        <Callout tone="note" title="You can only move forward sensibly">
          Statuses follow the real journey — the options you&apos;re offered match
          where the order is and how it&apos;s being delivered, and the system
          won&apos;t let you skip to an impossible step.
        </Callout>
      </Section>

      {/* Cancel */}
      <Section icon="solar:forbidden-circle-linear" title="Cancelling an order">
        <p>
          If an order can&apos;t go ahead, use <b>Cancel Order</b> at the top of the
          order. You&apos;ll be asked for a reason, and cancelling{" "}
          <b>releases the stock</b> that was held for it back into inventory.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MiniCard icon="solar:box-linear" title="Stock comes back">
            The items reserved for the order return to available stock, so nothing
            stays stuck.
          </MiniCard>
          <MiniCard icon="solar:clock-circle-linear" title="Not always available">
            Once an order is out for delivery, delivered, or completed it can no
            longer be cancelled — it&apos;s already on its way or done.
          </MiniCard>
        </div>
      </Section>
    </>
  );
}
