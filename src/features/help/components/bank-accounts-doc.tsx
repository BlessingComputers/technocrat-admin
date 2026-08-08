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
 * "Bank Accounts" walkthrough (ADR-0012) for `/checkout/bank-accounts` — the
 * company accounts customers pay into when they choose bank transfer at
 * checkout. Bento overview then vertical spine. Presentation-only; composes from
 * the Doc Kit.
 */
export function BankAccountsDoc() {
  return (
    <>
      {/* Intro */}
      <Section icon="solar:card-linear" title="Where customers send their money">
        <p>
          When a customer chooses to pay by <b>bank transfer</b> at checkout,
          they&apos;re shown one of the shop&apos;s bank accounts to pay into.
          This screen is where those accounts are set up and kept accurate.
        </p>
        <p>
          Get it right once and you rarely touch it again — but every detail here
          goes straight in front of a paying customer, so it&apos;s worth being
          careful.
        </p>
        <Path items={["Sidebar", "Bank Accounts"]} />
      </Section>

      {/* Overview — bento */}
      <Section
        icon="solar:routing-2-linear"
        title="How it fits together"
        subtitle="Four things to understand before you change anything."
      >
        <Bento>
          <StepCard
            n={1}
            span={5}
            tone="muted"
            bgIcon="solar:add-circle-linear"
            title="Add an account"
          >
            <p>
              Enter the bank, the account name, the number, and the bank code.
              That&apos;s the whole form.
            </p>
          </StepCard>

          <StepCard
            n={2}
            span={7}
            tone="inverted"
            bgIcon="solar:star-linear"
            title="Choose the primary one"
          >
            <p>
              One account is marked <b>Primary</b> — that&apos;s the one the shop
              leads with. Two switches control every account:
            </p>
            <ul className="mt-3 space-y-2">
              <StepPoint dark icon="solar:star-linear">
                <b>Primary</b> — the main account. Only one at a time.
              </StepPoint>
              <StepPoint dark icon="solar:power-linear">
                <b>Active</b> — whether it&apos;s in use at all.
              </StepPoint>
            </ul>
          </StepCard>

          <StepCard
            n={3}
            span={7}
            tone="card"
            bgIcon="solar:buildings-3-linear"
            title="The customer pays"
          >
            <p>
              They transfer the money from their own bank, then upload the proof
              of payment with their order.
            </p>
          </StepCard>

          <StepCard
            n={4}
            span={5}
            tone="gold"
            bgIcon="solar:check-circle-linear"
            title="You verify it"
          >
            <p>
              Check the money actually landed in the account, then confirm the
              order. That part happens in <b>Orders</b>.
            </p>
          </StepCard>
        </Bento>
      </Section>

      {/* Adding */}
      <Section
        icon="solar:add-circle-linear"
        title="Adding an account"
        subtitle="Five fields and two switches."
      >
        <Path items={["Bank Accounts", "Add Account"]} />
        <Steps
          steps={[
            {
              title: "Click Add Account",
              body: "A short form opens over the page.",
            },
            {
              title: "Fill in the bank details",
              body: "Bank name, account name, account number, and bank code. All four are required.",
            },
            {
              title: "Add a description if it helps",
              body: "This is for your team only — customers never see it. Use it to tell similar accounts apart, e.g. 'Primary NGN collection account'.",
            },
            {
              title: "Set Primary and Active",
              body: "Turn on Primary if this should be the shop's main account. Leave Active on so it can be used.",
            },
            {
              title: "Save it",
              body: "Click Add Account. The new card appears in the grid straight away.",
            },
          ]}
        />
        <Callout tone="warn" title="Check the account number twice">
          A wrong digit means customers send money somewhere it can&apos;t be
          recovered from. Read the number back against the bank statement or
          cheque book before you save.
        </Callout>
      </Section>

      {/* Fields */}
      <Section
        icon="solar:list-linear"
        title="What each field means"
        subtitle="In case the label isn't obvious."
      >
        <FieldTable
          rows={[
            [
              "Bank Name",
              "The bank the account is held with — e.g. Guaranty Trust Bank.",
            ],
            [
              "Account Name",
              "The name the account is registered in. This must match the bank's records exactly, or transfers can bounce.",
            ],
            [
              "Account Number",
              "The number customers transfer to. Enter it exactly, with no spaces.",
            ],
            [
              "Bank Code",
              "The short code that identifies the bank — e.g. 058. Your bank or finance team can confirm it.",
            ],
            [
              "Description",
              "An internal note to tell accounts apart. Staff-only — it is never shown to customers.",
            ],
            [
              "Primary",
              "Marks this as the shop's main account. Only one account is primary at a time.",
            ],
            [
              "Active",
              "Whether the account is in use. Switch it off to retire an account without deleting it.",
            ],
          ]}
        />
      </Section>

      {/* Managing existing */}
      <Section
        icon="solar:pen-2-linear"
        title="Changing an account"
        subtitle="Every card carries its own actions."
      >
        <p>
          Each account is a card in the grid. The primary one is highlighted with
          a <b>Primary</b> flag in its corner. The buttons at the top of a card
          do the following:
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MiniCard icon="solar:pen-2-linear" title="Edit">
            Reopens the form with the current details filled in, so you can
            correct anything.
          </MiniCard>
          <MiniCard icon="solar:power-linear" title="Active / inactive">
            Switches the account on or off without losing it.
          </MiniCard>
          <MiniCard icon="solar:trash-bin-trash-linear" title="Delete">
            Removes the account for good. Use this sparingly.
          </MiniCard>
        </div>
        <p>
          To promote a different account, click <b>Make Primary</b> at the bottom
          of its card. The flag moves across — you don&apos;t need to demote the
          old one yourself.
        </p>
        <Callout tone="tip" title="Switch off rather than delete">
          If an account is closing, set it to <b>inactive</b> instead of deleting
          it. Old orders still refer to it, and keeping the record makes past
          payments easier to trace.
        </Callout>
      </Section>

      {/* Primary vs active */}
      <Section
        icon="solar:info-circle-linear"
        title="Primary and Active are different things"
      >
        <p>
          It&apos;s easy to mix these up. <b>Active</b> decides whether an account
          can be used at all. <b>Primary</b> picks which of the active accounts is
          the shop&apos;s main one.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MiniCard icon="solar:star-linear" title="Primary">
            One account only. The shop&apos;s headline account for collecting
            payment.
          </MiniCard>
          <MiniCard icon="solar:power-linear" title="Active">
            Any number of accounts. Inactive ones stay on file but are out of use.
          </MiniCard>
        </div>
        <Callout tone="warn" title="Never leave the shop with no active account">
          If every account is inactive — or the primary one is switched off —
          customers paying by transfer have nowhere to send money. Make another
          account primary <b>before</b> you retire the current one.
        </Callout>
      </Section>

      {/* Cross-link */}
      <Section
        icon="solar:cart-large-2-linear"
        title="After the customer pays"
      >
        <p>
          Setting up an account is only half the job. When a transfer comes in,
          the customer&apos;s proof of payment appears on their order, and someone
          has to check the money arrived before the order moves on.
        </p>
        <Callout tone="tip" title="That flow lives in Orders">
          See the <b>Processing Orders</b> guide for verifying proof of payment,
          confirming, and rejecting bank-transfer orders.
        </Callout>
      </Section>
    </>
  );
}
