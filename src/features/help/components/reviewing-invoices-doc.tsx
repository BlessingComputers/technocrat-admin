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
 * "Reviewing Invoices" walkthrough (ADR-0012) for `/invoices`, the
 * pending-review queue, the detail page's review panel, and the rejected /
 * refund queue. The counterpart to `creating-manual-invoices` — this one is
 * about invoices the system raised for you. Presentation-only; composes from
 * the Doc Kit.
 */
export function ReviewingInvoicesDoc() {
  return (
    <>
      {/* Intro */}
      <Section icon="solar:bill-list-linear" title="The invoices that raise themselves">
        <p>
          When a customer orders on the storefront, an invoice is created for
          them automatically. Most need nothing from you. Some — the ones where a
          representative has to confirm the goods can actually be supplied — wait
          for a decision.
        </p>
        <p>
          This guide is about finding those, making the call, and dealing with the
          ones that end in a refund.
        </p>
        <Path items={["Sidebar", "Invoices"]} />
        <Callout tone="note" title="Raising an invoice by hand is a different job">
          For a walk-in or phone sale you record yourself, see the{" "}
          <b>Creating Manual Invoices</b> guide.
        </Callout>
      </Section>

      {/* Overview — bento */}
      <Section
        icon="solar:routing-2-linear"
        title="How an invoice moves"
        subtitle="From the queue to a decision, and sometimes to a refund."
      >
        <Bento>
          <StepCard
            n={1}
            span={5}
            tone="muted"
            bgIcon="solar:magnifer-linear"
            title="Find the invoice"
          >
            <p>
              Use the tabs and search on the main list, or jump straight to the
              queue of ones waiting on you.
            </p>
          </StepCard>

          <StepCard
            n={2}
            span={7}
            tone="card"
            bgIcon="solar:document-text-linear"
            title="Read the whole picture"
          >
            <p>
              The detail page gathers everything in one place — customer, items,
              amounts, and a timeline of what has happened so far and who did it.
            </p>
          </StepCard>

          <StepCard
            n={3}
            span={7}
            tone="inverted"
            bgIcon="solar:check-circle-linear"
            title="Make the call"
          >
            <p>
              The question is simply whether the goods are available:
            </p>
            <ul className="mt-3 space-y-2">
              <StepPoint dark icon="solar:check-circle-linear">
                <b>Available</b> — approve it and the order goes ahead
              </StepPoint>
              <StepPoint dark icon="solar:close-circle-linear">
                <b>Unavailable</b> — ask the customer what they want to do
              </StepPoint>
            </ul>
          </StepCard>

          <StepCard
            n={4}
            span={5}
            tone="jewel"
            bgIcon="solar:dollar-minimalistic-linear"
            title="Refund if needed"
          >
            <p>
              If the customer wants their money back, the invoice lands in the
              rejected queue, where you process the refund.
            </p>
          </StepCard>
        </Bento>
      </Section>

      {/* The list */}
      <Section
        icon="solar:list-linear"
        title="The invoice list"
        subtitle="Four tabs, four counters, and a search."
      >
        <Path items={["Invoices"]} />
        <p>
          The row of figures across the top is a live summary of the whole shop.
          Two of them are clickable and take you straight to a working queue.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MiniCard icon="solar:bill-list-linear" title="Total Invoiced">
            The full value invoiced across the shop.
          </MiniCard>
          <MiniCard icon="solar:clock-circle-linear" title="Pending Review">
            How many are waiting on a decision. Click it to open that queue.
          </MiniCard>
          <MiniCard icon="solar:bill-check-linear" title="Approved">
            How many have been cleared to go ahead.
          </MiniCard>
          <MiniCard icon="solar:bill-cross-linear" title="Rejected">
            How many were turned down. Click it to go and process refunds.
          </MiniCard>
        </div>
        <p>Underneath, the tabs split the list by where the invoice came from:</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MiniCard icon="solar:layers-minimalistic-linear" title="All">
            Everything the storefront has raised.
          </MiniCard>
          <MiniCard icon="solar:shop-linear" title="In House">
            Items the shop stocks itself. They come out of your own inventory, so
            there&apos;s nothing to check.
          </MiniCard>
          <MiniCard icon="solar:hand-shake-linear" title="Outsourced">
            Items you get in from a supplier. Someone has to confirm they can
            actually be supplied — these are the ones that need reviewing.
          </MiniCard>
          <MiniCard icon="solar:pen-2-linear" title="Manual">
            Offline sales written up by staff. Read-only here.
          </MiniCard>
        </div>
        <p>
          Search by invoice, and narrow by status with the dropdown beside it.
          Click any row to open it.
        </p>
        <Callout tone="note" title="One order can produce two invoices">
          If a customer buys some items you stock and some you have to source in,
          the order is split — an <b>in-house</b> invoice and an{" "}
          <b>outsourced</b> one, both for the same order. That&apos;s not a
          duplicate, and only the outsourced half needs reviewing.
        </Callout>
      </Section>

      {/* Reviewing */}
      <Section
        icon="solar:clock-circle-linear"
        title="Working the pending-review queue"
        subtitle="The everyday job."
      >
        <Path items={["Invoices", "Pending Review"]} />
        <Steps
          steps={[
            {
              title: "Open the queue",
              body: "Click the Pending Review figure at the top of the invoice list. You get just the invoices awaiting a decision, newest first.",
            },
            {
              title: "Pick one and click Review",
              body: "That opens the full invoice. Search by invoice number if you're chasing a specific one.",
            },
            {
              title: "Read the invoice before deciding",
              body: "Check the customer, the items, and the amounts. The timeline shows what's already happened and who did it.",
            },
            {
              title: "Set product availability",
              body: "At the bottom of the page, choose Available or Unavailable. This applies to the whole invoice.",
            },
            {
              title: "If it's available, approve it",
              body: "Click Approve Invoice. That's the end of it — the order carries on.",
            },
            {
              title: "If it's not, speak to the customer first",
              body: "Two more panels appear. Contact the customer, find out whether they'll wait or want their money back, then record their answer under Customer decision.",
            },
            {
              title: "Submit the decision",
              body: "Agreed to wait keeps the invoice alive and you approve it. Requests refund turns the button red — clicking it rejects the invoice and queues the refund.",
            },
          ]}
        />
        <Callout tone="note" title="No review panel on this invoice?">
          The panel only appears on <b>outsourced</b> invoices that have been{" "}
          <b>paid</b>. Anything else — in-house, unpaid, or already decided — has
          nothing to review, so the page just shows the record.
        </Callout>
      </Section>

      {/* Decision matrix */}
      <Section
        icon="solar:routing-2-linear"
        title="What each answer does"
        subtitle="Two questions, three outcomes."
      >
        <FieldTable
          rows={[
            [
              "Available",
              "The goods can be supplied. Approving is the whole decision — no customer conversation needed.",
            ],
            [
              "Unavailable + Agreed to wait",
              "The customer is happy to hold on. The invoice is approved and the order continues, just later than planned.",
            ],
            [
              "Unavailable + Requests refund",
              "The customer wants their money back. The invoice is rejected and moves to the rejected queue for a refund.",
            ],
          ]}
        />
        <Callout tone="warn" title="Ask the customer before you record an answer">
          <b>Customer decision</b> means what the customer actually told you —
          it&apos;s not a guess on their behalf. Reach them first, then record it.
        </Callout>
        <p>
          If the representative on the invoice can&apos;t reach the customer, use{" "}
          <b>Re assign</b> in the Customer Communication panel to hand the
          conversation to someone else.
        </p>
      </Section>

      {/* Rejected & refunds */}
      <Section
        icon="solar:dollar-minimalistic-linear"
        title="Rejected invoices & refunds"
        subtitle="Closing the loop on money owed back."
      >
        <Path items={["Invoices", "Rejected"]} />
        <p>
          The rejected queue lists everything that was turned down or only partly
          approved, with three running totals so you can see what still needs
          paying back.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MiniCard icon="solar:bill-list-linear" title="Total Amount">
            The value of everything in this queue.
          </MiniCard>
          <MiniCard icon="solar:bill-check-linear" title="Refunded">
            Money already sent back.
          </MiniCard>
          <MiniCard icon="solar:clock-circle-linear" title="Pending refund">
            Money still owed to customers. Work this down to zero.
          </MiniCard>
        </div>
        <Steps
          steps={[
            {
              title: "Open a rejected invoice",
              body: "Click its row from the rejected list.",
            },
            {
              title: "Click Process Refund",
              body: "The button sits at the top right. It only shows on invoices that were rejected or partially approved.",
            },
            {
              title: "Tick the items you're refunding",
              body: "You don't have to refund everything — tick only the lines going back, and set the quantity for each.",
            },
            {
              title: "Check the amounts",
              body: "Each line shows its unit price and what that quantity comes to. Read the figures back before you commit.",
            },
            {
              title: "Click Refund",
              body: "The refund is recorded against the invoice and the queue totals update.",
            },
          ]}
        />
        <Callout tone="warn" title="Recording isn't paying">
          Marking a refund here records the decision in the system. Actually
          sending the money back to the customer is a separate step — make sure
          whoever handles payments knows.
        </Callout>
      </Section>

      {/* Status reference */}
      <Section
        icon="solar:info-circle-linear"
        title="What the status labels mean"
        subtitle="The coloured pill on each row."
      >
        <FieldTable
          rows={[
            ["Draft", "Started but not yet issued to the customer."],
            ["Issued", "Sent to the customer, waiting on payment."],
            [
              "Paid",
              "The customer has paid. On an outsourced invoice this shows as Pending review instead, because it still needs your decision.",
            ],
            [
              "Pending review",
              "Paid, outsourced, and waiting on someone to confirm availability. This is your queue.",
            ],
            ["Approved", "Cleared to go ahead."],
            [
              "Partially approved",
              "Some items are going ahead and some aren't — usually part of the order needs refunding.",
            ],
            [
              "Rejected",
              "Turned down, with a refund owed. Sits in the rejected queue.",
            ],
            ["Cancelled", "Called off. Nothing further happens."],
          ]}
        />
      </Section>
    </>
  );
}
