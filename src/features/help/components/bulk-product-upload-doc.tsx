import {
  Section,
  Path,
  Steps,
  StepCard,
  StepPoint,
  Bento,
  Tile,
  Callout,
} from "./doc-kit";

/**
 * "Bulk & AI product upload" walkthrough (ADR-0012). Covers `/catalogues/bulk`:
 * the AI smart-paste flow, the review grid, batch markup, and the background
 * import. Opens with a bento step mosaic, then a vertical spine for the detail.
 * Written for non-technical staff; presentation-only, composes from the Doc Kit.
 */
export function BulkProductUploadDoc() {
  return (
    <>
      {/* Intro */}
      <Section icon="solar:magic-stick-3-linear" title="Adding many products at once">
        <p>
          When a supplier sends a whole list, you don&apos;t have to add each
          product by hand. <b>Bulk upload</b> turns a pasted list into a grid of
          products you can review together, then creates them all in one go.
        </p>
        <p>
          The clever part is <b>AI Smart Paste</b>: paste the supplier&apos;s raw
          text and the AI works out the name, brand, price, and specs for each
          line — you just check its work and upload.
        </p>
        <Path items={["Catalogue", "Add Product", "Bulk / AI import"]} />
      </Section>

      {/* When to use it */}
      <Section icon="solar:routing-2-linear" title="When to use it">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Tile
            icon="solar:magic-stick-3-linear"
            tone="primary"
            title="A supplier list"
            body="Paste the whole thing and let AI structure it into rows — the fastest way to add many products."
          />
          <Tile
            icon="solar:box-linear"
            tone="jewel"
            title="Even a single product"
            body="Adding just one? Bulk upload with a single manual row is quicker than the full product form."
          />
        </div>
      </Section>

      {/* Flow — bento mosaic (the ADR-0012 overview tier) */}
      <Section
        icon="solar:layers-minimalistic-linear"
        title="How a bulk upload works"
        subtitle="Paste, review, and upload — with AI doing the heavy lifting."
      >
        <Bento>
          <StepCard
            n={1}
            span={7}
            tone="muted"
            bgIcon="solar:document-text-linear"
            title="Paste the supplier list"
          >
            <p>
              Drop the raw text into the <b>AI Smart Paste</b> box and click{" "}
              <b>Parse with AI</b>. Each product becomes a row you can edit. No
              list? Click <b>Add Product</b> to type a row by hand.
            </p>
          </StepCard>

          <StepCard
            n={2}
            span={5}
            tone="inverted"
            bgIcon="solar:check-circle-linear"
            title="Review each row"
          >
            <p>The AI is a helper, not the last word. Check every row:</p>
            <ul className="mt-3 space-y-2">
              <StepPoint dark>Name, brand &amp; category</StepPoint>
              <StepPoint dark>Cost, price &amp; stock</StepPoint>
              <StepPoint dark icon="solar:danger-triangle-linear">
                Fix anything flagged
              </StepPoint>
            </ul>
          </StepCard>

          <StepCard
            n={3}
            span={5}
            tone="card"
            bgIcon="solar:tag-price-linear"
            title="Set a markup"
          >
            <p>
              The <b>Markup %</b> box adds a percentage on top of each cost to work
              out the selling price. Change it once and every row updates.
            </p>
          </StepCard>

          <StepCard
            n={4}
            span={7}
            tone="muted"
            bgIcon="solar:gallery-add-linear"
            title="Attach photos (optional)"
          >
            <p>
              Each row has an image button — add photos and pick a main one. You
              can always add or change photos later on each product&apos;s page.
            </p>
          </StepCard>

          <StepCard
            n={5}
            span={12}
            tone="jewel"
            bgIcon="solar:cloud-upload-linear"
            title="Upload the batch"
          >
            <p>
              Click <b>Upload</b>. Photos go up first, then the products are
              created in the background — you&apos;ll see progress and a summary
              when it finishes. Only rows marked <b>ready</b> are uploaded;
              anything that fails stays on screen for you to retry.
            </p>
          </StepCard>
        </Bento>
      </Section>

      {/* Detailed spine */}
      <Section
        icon="solar:cloud-upload-linear"
        title="Step by step"
        subtitle="Follow along with the page open."
      >
        <Path items={["Catalogue", "Add Product", "Bulk / AI import"]} />
        <Steps
          steps={[
            {
              title: "Open Bulk / AI import",
              body: "From the Catalogue home, open Add Product and choose Bulk / AI import.",
            },
            {
              title: "Paste and parse",
              body: 'Paste the supplier list into the AI Smart Paste box and click "Parse with AI". Each product turns into a row below. To add one by hand instead, click "Add Product".',
            },
            {
              title: "Review the rows",
              body: "Check each row — name, category, brand, cost, price, and stock. The counter at the top shows how many are ready and how many still need attention; fix the flagged ones before uploading.",
            },
            {
              title: "Set the markup",
              body: "The parsed supplier price goes into Cost. Enter a Markup % to work out the selling price on top of it — every row recalculates.",
            },
            {
              title: "Add photos (optional)",
              body: "Use each row's image button to attach photos and choose the main image.",
            },
            {
              title: "Upload",
              body: 'Click "Upload" — photos upload first, then the products are created in the background. Watch the progress bar; a summary appears when it finishes.',
            },
          ]}
        />
        <Callout tone="tip" title="Smart paste reads messy lists">
          Prices, quantities, model codes in brackets — the AI does its best to
          pull them apart into tidy rows. It leaves anything it&apos;s unsure of
          blank, so always give the rows a quick once-over before uploading.
        </Callout>
        <Callout tone="warn" title="Uploads start hidden">
          New products are created <b>hidden</b> (a draft) with the selling price
          equal to cost until you add your markup — so nothing goes live before
          you&apos;ve checked it. Switch each one to <b>Live</b> when it&apos;s
          ready for customers.
        </Callout>
        <Callout tone="note" title="Watch for duplicate part numbers">
          If two rows share the same Part Number, they&apos;re flagged — each
          product needs its own. Give the duplicates a unique number before
          uploading.
        </Callout>
      </Section>

      {/* Safety net */}
      <Section icon="solar:refresh-linear" title="If something interrupts you">
        <p>
          Bulk upload is built to be forgiving — you won&apos;t lose your work to a
          closed tab or a hiccup mid-upload.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Tile
            icon="solar:refresh-linear"
            tone="navy"
            title="Your rows are saved"
            body="Leave and come back and the page offers to restore the rows you were working on — nothing is lost."
          />
          <Tile
            icon="solar:cloud-upload-linear"
            tone="primary"
            title="Uploads can resume"
            body="If a photo upload is interrupted, already-uploaded images are kept — retry the rest, or create the products without them and add photos later."
          />
        </div>
        <Callout tone="note" title="Failed rows stay put">
          When a batch finishes, the products that were created disappear from the
          list and any that failed stay behind — so you can fix and re-upload just
          those, without touching the ones that worked.
        </Callout>
      </Section>
    </>
  );
}
