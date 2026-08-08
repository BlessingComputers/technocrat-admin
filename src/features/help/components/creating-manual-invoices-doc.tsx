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
 * "Creating Manual Invoices" walkthrough (ADR-0012) for `/invoices/manual/new`
 * — recording an offline sale where money has already been collected. Bento
 * overview then vertical spine. Presentation-only; composes from the Doc Kit.
 */
export function CreatingManualInvoicesDoc() {
  return (
    <>
      {/* Intro */}
      <Section icon="solar:bill-list-linear" title="Writing up an offline sale">
        <p>
          Most invoices create themselves when a customer orders online. A{" "}
          <b>manual invoice</b> is for the sales that don&apos;t — someone walks
          into the shop, calls, or messages on WhatsApp, pays you there and then,
          and takes the goods.
        </p>
        <p>
          You&apos;re not asking for money here. You&apos;re <b>recording money
          already collected</b>, so the sale shows up in the shop&apos;s books and
          the customer has a proper receipt.
        </p>
        <Path items={["Sidebar", "Invoices", "Create Invoice"]} />
      </Section>

      {/* Overview — bento */}
      <Section
        icon="solar:routing-2-linear"
        title="The form, in four parts"
        subtitle="One page, top to bottom. Nothing is saved until you submit."
      >
        <Bento>
          <StepCard
            n={1}
            span={7}
            tone="muted"
            bgIcon="solar:user-linear"
            title="Who bought it"
          >
            <p>
              Their name, and their email or phone if you have it. If they already
              have an account, you can link it instead of typing it out.
            </p>
          </StepCard>

          <StepCard
            n={2}
            span={5}
            tone="card"
            bgIcon="solar:box-linear"
            title="What they bought"
          >
            <p>
              Add each item with its quantity and price. At least one item is
              required.
            </p>
          </StepCard>

          <StepCard
            n={3}
            span={5}
            tone="gold"
            bgIcon="solar:tag-price-linear"
            title="What it came to"
          >
            <p>
              Add tax or delivery if they apply. The total works itself out as you
              type.
            </p>
          </StepCard>

          <StepCard
            n={4}
            span={7}
            tone="inverted"
            bgIcon="solar:wallet-linear"
            title="How they paid"
          >
            <p>
              The last block records the payment and who took it:
            </p>
            <ul className="mt-3 space-y-2">
              <StepPoint dark icon="solar:card-linear">
                <b>Payment method</b> — cash, transfer, POS, card, or cheque
              </StepPoint>
              <StepPoint dark icon="solar:shop-linear">
                <b>Sales channel</b> — where the sale came from
              </StepPoint>
              <StepPoint dark icon="solar:user-linear">
                <b>Issued by</b> — filled in with your name automatically
              </StepPoint>
            </ul>
          </StepCard>
        </Bento>
      </Section>

      {/* Step-by-step */}
      <Section
        icon="solar:document-text-linear"
        title="Creating the invoice"
        subtitle="Follow along with the form open."
      >
        <Path items={["Invoices", "Create Invoice"]} />
        <Steps
          steps={[
            {
              title: "Open the form",
              body: "From Invoices, click Create Invoice at the top right.",
            },
            {
              title: "Enter the customer's name",
              body: "First and last name are required. Email and phone are optional but worth adding — they're how you find the sale again later.",
            },
            {
              title: "Link an existing customer if there is one",
              body: "Use the customer picker to search accounts. Picking one fills in their details and ties the invoice to their record, so it shows on their profile.",
            },
            {
              title: "Add the delivery address if you're sending goods out",
              body: "Open the Add Address panel. It's optional — skip it for a walk-in who carried the goods away.",
            },
            {
              title: "Add each item",
              body: "Click Add item and enter the product name, quantity, and unit price. Variant and SKU are optional. Repeat for everything they bought.",
            },
            {
              title: "Add tax and delivery",
              body: "Tax is a percentage; shipping is an amount. Leave them blank if neither applies. Watch the summary underneath — it updates live.",
            },
            {
              title: "Record how they paid",
              body: "Pick the payment method, and add a reference if there is one (a transfer reference or POS slip number). Pick the sales channel.",
            },
            {
              title: "Add a note if anything needs explaining",
              body: "Free text for context — a discount you agreed, a promise to deliver on Friday. Whoever reads this invoice later will thank you.",
            },
            {
              title: "Create it",
              body: "Click Create Invoice. You land on the finished invoice, ready to read out or copy the number.",
            },
          ]}
        />
        <Callout tone="tip" title="Nothing saves until the last click">
          You can move around the form freely, add and remove items, and change
          your mind. If you leave the page before clicking <b>Create Invoice</b>,
          nothing is recorded.
        </Callout>
      </Section>

      {/* Items */}
      <Section
        icon="solar:box-linear"
        title="Adding items"
        subtitle="One row per thing sold."
      >
        <p>
          Items are typed in by hand — this isn&apos;t linked to the catalogue, so
          you can invoice anything, including one-off items and services.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MiniCard icon="solar:box-linear" title="Product name">
            Required. Write it the way the customer would recognise it.
          </MiniCard>
          <MiniCard icon="solar:tag-linear" title="Variant & SKU">
            Optional. Useful when colour or model matters, or for matching back to
            stock.
          </MiniCard>
          <MiniCard icon="solar:layers-minimalistic-linear" title="Quantity">
            A whole number, at least 1.
          </MiniCard>
          <MiniCard icon="solar:tag-price-linear" title="Unit price">
            The price for <b>one</b> — not the line total. The invoice multiplies
            it out for you.
          </MiniCard>
        </div>
        <p>
          Added an item by mistake? Remove it from the items table and add it
          again.
        </p>
        <Callout tone="warn" title="Unit price, not total">
          The most common slip is entering the total for the line in the unit
          price box. Three items at ₦5,000 each means quantity <b>3</b> and unit
          price <b>5,000</b> — not 15,000.
        </Callout>
      </Section>

      {/* Fields reference */}
      <Section
        icon="solar:list-linear"
        title="Every field, explained"
        subtitle="Required fields are marked with a red asterisk on the form."
      >
        <FieldTable
          rows={[
            [
              "First & last name",
              "Required. Who the invoice is for.",
            ],
            [
              "Email & phone",
              "Optional contact details. Add at least one if you can — it's how the customer and the sale stay connected.",
            ],
            [
              "Existing customer",
              "Optional. Links the invoice to a storefront account so it appears in that customer's history.",
            ],
            [
              "Address",
              "Optional. Only needed when goods are being delivered.",
            ],
            [
              "Items",
              "At least one. Each needs a name, a quantity, and a unit price.",
            ],
            [
              "Tax %",
              "Optional. A percentage of the subtotal, e.g. 7.5.",
            ],
            [
              "Shipping cost",
              "Optional. A flat amount added to the total.",
            ],
            [
              "Payment method",
              "Required. How the money was actually collected.",
            ],
            [
              "Payment reference",
              "Optional. A transfer reference, POS slip, or cheque number — anything that helps trace the payment later.",
            ],
            [
              "Sales channel",
              "Optional. Where the sale came from: walk in, phone, WhatsApp, social media, or other.",
            ],
            ["Note", "Optional. Free text for anything worth explaining."],
            [
              "Invoice issued by",
              "Filled in automatically with your name. You can't change it — it's the audit trail.",
            ],
          ]}
        />
      </Section>

      {/* After */}
      <Section
        icon="solar:check-circle-linear"
        title="After you create it"
        subtitle="What the finished invoice does and doesn't allow."
      >
        <p>
          A manual invoice is created as <b>Paid</b> — the money is already in.
          You&apos;ll find it back under <b>Invoices</b> on the <b>Manual</b> tab.
        </p>
        <Path items={["Invoices", "Manual tab"]} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MiniCard icon="solar:copy-linear" title="Copy the number">
            The invoice number can be copied straight from the detail page to read
            out or paste into a message.
          </MiniCard>
          <MiniCard icon="solar:document-text-linear" title="Read it back">
            The detail page shows the items, totals, payment, who issued it, and
            when.
          </MiniCard>
          <MiniCard icon="solar:forbidden-circle-linear" title="Cancel it">
            If it was raised in error, cancel it from its detail page.
          </MiniCard>
        </div>
        <Callout tone="warn" title="You can't edit a manual invoice">
          Once created, the details are fixed — that&apos;s what makes it a
          reliable record. If something is wrong, <b>cancel</b> it and create a
          fresh one. Cancelling leaves the original on file rather than erasing
          it.
        </Callout>
      </Section>

      {/* Boundaries */}
      <Section
        icon="solar:info-circle-linear"
        title="When not to use this"
      >
        <p>
          Manual invoices are only for sales taken <b>outside</b> the storefront.
          If the customer ordered online, an invoice already exists — go and find
          it rather than typing a second one, or the sale will be counted twice.
        </p>
        <Callout tone="tip" title="Looking for an online order's invoice?">
          Those live on the <b>All</b>, <b>In House</b>, and <b>Outsourced</b>{" "}
          tabs. See the <b>Reviewing Invoices</b> guide.
        </Callout>
      </Section>
    </>
  );
}
