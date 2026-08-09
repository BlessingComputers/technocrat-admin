import {
  Section,
  Path,
  StepCard,
  StepPoint,
  Bento,
  MiniCard,
  Callout,
} from "./doc-kit";

/**
 * "Managing Customers" walkthrough (ADR-0012) for `/customers`. Customers is an
 * inspect-only surface — accounts are self-registered on the storefront, so this
 * guide is about finding a customer and reading their profile, not creating or
 * editing one. Bento overview then vertical spine. Written for non-technical
 * staff; presentation-only, composes from the Doc Kit.
 */
export function ManagingCustomersDoc() {
  return (
    <>
      {/* Intro */}
      <Section icon="solar:users-group-rounded-linear" title="The customer directory">
        <p>
          <b>Customers</b> is the record of everyone who has an account on the
          storefront. It&apos;s a place to <b>look things up</b> — who someone is,
          what they&apos;ve bought, how to reach them — when you&apos;re helping
          them or checking an order.
        </p>
        <p>
          Customers create and manage their own accounts when they shop, so you
          don&apos;t add or edit them here. Think of this as a directory you read,
          not a form you fill in.
        </p>
        <Path items={["Sidebar", "Customers"]} />
      </Section>

      {/* Overview — bento */}
      <Section
        icon="solar:routing-2-linear"
        title="Looking someone up"
        subtitle="Find them, open their profile, and see the full picture."
      >
        <Bento>
          <StepCard
            n={1}
            span={5}
            tone="muted"
            bgIcon="solar:magnifer-linear"
            title="Find the customer"
          >
            <p>
              Search by name or email, or filter the list — then open their row.
            </p>
          </StepCard>

          <StepCard
            n={2}
            span={7}
            tone="inverted"
            bgIcon="solar:user-linear"
            title="Open their profile"
          >
            <p>Their page gathers everything about them in one place:</p>
            <ul className="mt-3 space-y-2">
              <StepPoint dark icon="solar:letter-linear">
                Contact details &amp; whether they&apos;re verified
              </StepPoint>
              <StepPoint dark icon="solar:star-linear">
                Loyalty tier &amp; points
              </StepPoint>
            </ul>
          </StepCard>

          <StepCard
            n={3}
            span={7}
            tone="card"
            bgIcon="solar:cart-large-2-linear"
            title="See their history"
          >
            <p>
              Their orders and invoices are listed together with quick totals —
              how many orders, how much they&apos;ve spent, and when they last
              bought.
            </p>
          </StepCard>

          <StepCard
            n={4}
            span={5}
            tone="jewel"
            bgIcon="solar:check-circle-linear"
            title="Help them faster"
          >
            <p>
              With the full picture in front of you, you can answer questions and
              sort out orders without asking them to repeat themselves.
            </p>
          </StepCard>
        </Bento>
      </Section>

      {/* Finding */}
      <Section
        icon="solar:magnifer-linear"
        title="Finding a customer"
        subtitle="Search and filter the directory."
      >
        <Path items={["Customers"]} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MiniCard icon="solar:magnifer-linear" title="Search">
            By name or email address.
          </MiniCard>
          <MiniCard icon="solar:filter-linear" title="Status">
            Show Active, Suspended, or Deleted accounts.
          </MiniCard>
          <MiniCard icon="solar:star-linear" title="Advanced">
            Filter by loyalty tier, or by the date range they joined.
          </MiniCard>
        </div>
        <p>
          Click any customer in the list to open their full profile.
        </p>
      </Section>

      {/* Reading the profile */}
      <Section
        icon="solar:user-linear"
        title="Reading a customer's profile"
        subtitle="What each part of their page shows."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MiniCard icon="solar:chart-2-linear" title="The numbers">
            Total orders, lifetime value, average order, and their last order date
            — a quick read on how they shop.
          </MiniCard>
          <MiniCard icon="solar:cart-large-2-linear" title="Orders">
            Their order history, so you can open any one to see what happened.
          </MiniCard>
          <MiniCard icon="solar:bill-list-linear" title="Invoices">
            Any invoices raised for them, alongside the orders.
          </MiniCard>
          <MiniCard icon="solar:letter-linear" title="Profile & contact">
            Email and phone (with a tick when verified), customer ID, when they
            joined, and their saved delivery addresses.
          </MiniCard>
        </div>
      </Section>

      {/* Loyalty */}
      <Section icon="solar:star-linear" title="Loyalty tiers & points">
        <p>
          Customers earn <b>loyalty points</b> as they shop, which move them up
          through <b>tiers</b>. The tier and points are shown on their profile and
          you can filter the directory by tier.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniCard icon="solar:star-linear" title="Bronze">
            The starting tier for new shoppers.
          </MiniCard>
          <MiniCard icon="solar:star-linear" title="Silver">
            Regular customers who&apos;ve bought a few times.
          </MiniCard>
          <MiniCard icon="solar:star-linear" title="Gold">
            Loyal, frequent buyers.
          </MiniCard>
          <MiniCard icon="solar:star-linear" title="Platinum">
            Your very best, highest-value customers.
          </MiniCard>
        </div>
        <Callout tone="note" title="Tiers are earned, not set">
          A customer&apos;s tier reflects their own activity and rises
          automatically — it isn&apos;t something you assign by hand here.
        </Callout>
      </Section>

      {/* What you can't do */}
      <Section icon="solar:info-circle-linear" title="What you can (and can't) do here">
        <p>
          This screen is for <b>looking</b>, not editing. You can search, filter,
          and read everything about a customer — but their name, email, password,
          and addresses are theirs to change from their own account.
        </p>
        <Callout tone="tip" title="Need to act on an order?">
          To actually do something — confirm a payment, fulfil, or cancel — open
          the order itself from <b>Orders</b>, or from the customer&apos;s order
          list. See the <b>Processing Orders</b> guide.
        </Callout>
      </Section>
    </>
  );
}
