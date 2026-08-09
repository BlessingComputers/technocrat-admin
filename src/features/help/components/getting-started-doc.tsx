import { Section, Path, Steps, Tile, MiniCard, Callout } from "./doc-kit";

/**
 * "Getting started" — a short orientation to the admin for new staff. Reference
 * type (R) and permission-free, so it anchors the hub for everyone (ADR-0011).
 * Written for non-technical staff; presentation-only, composes from the Doc Kit.
 */
export function GettingStartedDoc() {
  return (
    <>
      <Section icon="solar:compass-linear" title="Welcome to the admin">
        <p>
          This is the workspace your team uses to run the shop — the catalogue,
          orders, invoices, stock, customer chat, and the settings behind them.
          You won&apos;t need every part of it; what you can see depends on your
          role. This guide is a two-minute tour so you know your way around.
        </p>
        <p>
          Everything here is a normal web page. There&apos;s nothing to install,
          nothing can break by clicking around, and the guides in this Help Center
          walk through each task step by step when you need them.
        </p>
      </Section>

      <Section
        icon="solar:map-point-linear"
        title="Finding your way around"
        subtitle="The three parts of every screen."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MiniCard icon="solar:hamburger-menu-linear" title="The sidebar">
            Down the left is the menu — Overview, Catalogues, Orders, and the
            rest. It&apos;s how you move between sections.
          </MiniCard>
          <MiniCard icon="solar:widget-2-linear" title="The top bar">
            Across the top sit search, notifications, theme, and this Help button
            — the tools you reach for on any page.
          </MiniCard>
          <MiniCard icon="solar:document-text-linear" title="The page">
            The middle is wherever you are — a list, a form, or a guide like this
            one.
          </MiniCard>
        </div>
        <Callout tone="note" title="On a phone or a narrow window">
          The sidebar tucks itself away to give the page room. Tap the{" "}
          <b>menu button</b> at the top-left to slide it out, and tap anything —
          or outside it — to close it again.
        </Callout>
      </Section>

      <Section icon="solar:shield-user-linear" title="Roles & permissions">
        <p>
          Each staff member has a <b>role</b>, and the role decides which sections
          they can open and what they can change. A sales agent, for example, sees
          orders and customers but not the security or user-management tools.
        </p>
        <p>
          That&apos;s why your sidebar might look shorter than a colleague&apos;s
          — it only lists what your role covers. If you need access to something
          you can&apos;t see, ask an administrator to adjust your role rather than
          working around it.
        </p>
        <Callout tone="tip" title="Super admins see everything">
          A super admin has the full menu and every action. If that&apos;s you,
          remember others see a trimmed-down version — so a guide may mention a
          section a teammate doesn&apos;t have.
        </Callout>
      </Section>

      <Section
        icon="solar:magnifer-linear"
        title="Finding things quickly"
        subtitle="Two ways to get where you're going."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Tile
            icon="solar:list-linear"
            tone="primary"
            title="Browse the sidebar"
            body="Jump straight to a section — Orders, Customers, Invoices — from the menu on the left."
          />
          <Tile
            icon="solar:question-circle-linear"
            tone="jewel"
            title="Search the Help Center"
            body="Not sure how to do something? Open Help, type what you're after, and the matching guide comes up."
          />
        </div>
      </Section>

      <Section icon="solar:moon-linear" title="Switching light & dark">
        <p>
          The admin comes in a light and a dark theme — pick whichever is easier
          on your eyes. Your choice is remembered on this device.
        </p>
        <Path items={["Top bar", "Theme toggle"]} />
        <p>
          Click the sun/moon button in the top bar to switch. Nothing else
          changes — same pages, same buttons, just a different look.
        </p>
      </Section>

      <Section icon="solar:book-linear" title="Where to go next">
        <p>
          Head back to the <b>Help Center</b> and pick the area you work in most.
          Each guide is written in plain language and walks you through the task
          one step at a time.
        </p>
        <Steps
          steps={[
            {
              title: "Open the Help Center",
              body: "Use the Help button in the top bar, or the Help item at the bottom of the sidebar.",
            },
            {
              title: "Pick your area",
              body: "Choose a category — Catalogue & Pricing, Orders & Customers, and so on — or search for a task by name.",
            },
            {
              title: "Follow the guide",
              body: "Work through the steps with the admin open in another tab. You can always come back for the next one.",
            },
          ]}
        />
      </Section>
    </>
  );
}
