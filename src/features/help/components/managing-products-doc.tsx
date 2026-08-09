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
 * "Managing Products" walkthrough (ADR-0012). Opens with a bento step mosaic of
 * the product lifecycle, then drops into vertical spine sections for the precise
 * create / find / edit flows. Written for non-technical staff — plain language,
 * presentation-only, composes from the Doc Kit.
 */
export function ManagingProductsDoc() {
  return (
    <>
      {/* Intro */}
      <Section icon="solar:box-linear" title="Products & the catalogue">
        <p>
          A <b>product</b> is something the shop sells — a laptop, a monitor, a
          printer. Everything you sell lives in the <b>Catalogue</b>, and this
          guide covers the whole life of a product: creating it, giving it photos
          and a price, putting it live for customers, and keeping it tidy
          afterwards.
        </p>
        <p>
          The Catalogue home shows how the shelf is doing at a glance — how many
          products you have, how many are live, and what&apos;s running low — with
          quick ways in to the full list, to Parts, and to Brands &amp;
          Categories.
        </p>
        <Path items={["Sidebar", "Catalogues"]} />
      </Section>

      {/* Lifecycle — bento mosaic (the ADR-0012 overview tier) */}
      <Section
        icon="solar:routing-2-linear"
        title="A product, start to finish"
        subtitle="The five stages every product goes through."
      >
        <Bento>
          <StepCard
            n={1}
            span={7}
            tone="muted"
            bgIcon="solar:box-linear"
            title="Create the product"
          >
            <p>
              Give it a name, category, brand, and a short description. You can
              type the details in, or paste a supplier listing and let{" "}
              <b>AI fill</b> the form for you.
            </p>
          </StepCard>

          <StepCard
            n={2}
            span={5}
            tone="inverted"
            bgIcon="solar:gallery-linear"
            title="Add its photos"
          >
            <p>Good photos sell. Add a few and pick the main one.</p>
            <ul className="mt-3 space-y-2">
              <StepPoint dark icon="solar:gallery-add-linear">
                Upload from your computer
              </StepPoint>
              <StepPoint dark icon="solar:star-linear">
                Choose the image customers see first
              </StepPoint>
            </ul>
          </StepCard>

          <StepCard
            n={3}
            span={12}
            tone="card"
            bgIcon="solar:tag-price-linear"
            title="Price it & set the stock"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <p>
                Set the <b>selling price</b> — what the customer pays — and, if you
                like, the <b>cost</b> you paid, so the shop can work out your
                profit. Enter how many you have in <b>stock</b>.
              </p>
              <p>
                Prefer not to price each one by hand? <b>Markup rules</b> can price
                a whole group automatically — see the Pricing guide.
              </p>
            </div>
          </StepCard>

          <StepCard
            n={4}
            span={6}
            tone="jewel"
            bgIcon="solar:power-linear"
            title="Make it live"
          >
            <p>
              A product is hidden until you switch <b>Live Status</b> on. Flip it
              when the details and price are right, and customers can see it.
            </p>
          </StepCard>

          <StepCard
            n={5}
            span={6}
            tone="muted"
            bgIcon="solar:pen-2-linear"
            title="Keep it up to date"
          >
            <p>
              Prices change, stock moves. Open a product any time to edit it,
              hide it, or feature it on the storefront.
            </p>
          </StepCard>
        </Bento>
      </Section>

      {/* Create */}
      <Section
        icon="solar:add-circle-linear"
        title="Creating a product"
        subtitle="The everyday way to add one product."
      >
        <Path items={["Catalogue", "Add Product", "Single product"]} />
        <Steps
          steps={[
            {
              title: 'Click "Add Product", then "Single product"',
              body: "From the Catalogue home, open the Add Product menu and choose Single product. (Bulk / AI import is for adding many at once — see the Bulk upload guide.)",
            },
            {
              title: "Fill in the general details",
              body: "Give the product a name, pick its Category and Brand, and add a description. The web-address slug is filled in from the name for you.",
            },
            {
              title: "Set pricing & inventory",
              body: "Enter the Part Number (SKU), the Price customers pay, the Cost you paid (optional), how many are in Stock, and the condition — New, Refurbished, Used, or Open Box.",
            },
            {
              title: "Choose the status",
              body: "Leave Live Status off while you're still setting up, or switch it on to publish straight away. Turn on Featured to highlight it in collections.",
            },
            {
              title: "Save",
              body: "Click Save Product. You're taken to the product's edit page so you can add photos next.",
            },
            {
              title: "Add photos",
              body: "In the Images section, upload the product's photos and mark the main one. Save again.",
            },
          ]}
        />
        <Callout tone="tip" title="Fill the form with AI">
          At the top of the form is <b>AI Fill from listing</b>. Paste one
          supplier listing, click <b>Fill with AI</b>, and it fills the fields it
          can read — name, category, brand, price, specs — for you to check. It
          only fills what it finds and never touches your status or featured
          switches.
        </Callout>
        <Callout tone="note" title="Photos come after the first save">
          A brand-new product has to be saved once before it can hold images —
          that&apos;s why creating one drops you on its edit page. Add the photos
          there and save a second time.
        </Callout>
      </Section>

      {/* Find & edit */}
      <Section
        icon="solar:magnifer-linear"
        title="Finding a product to edit"
        subtitle="The full, searchable list of everything you sell."
      >
        <Path items={["Catalogue", "Products"]} />
        <p>
          The Catalogue home shows a snapshot; the <b>Products</b> list is the
          full working view. Open it to search by name, filter (by brand,
          category, or stock level), and sort — then click any product to open it.
        </p>
        <Steps
          steps={[
            {
              title: "Open the Products list",
              body: "From the Catalogue home, choose Products (or “View all”). This is the complete, searchable catalogue.",
            },
            {
              title: "Find the product",
              body: "Search by name or part number, or narrow the list with the filters — including “low stock” and “out of stock” for items that need attention.",
            },
            {
              title: "Open it, then Edit",
              body: "Click the product to see its full page, then use Edit Product to change any detail. Save when you're done.",
            },
          ]}
        />
      </Section>

      {/* The product page */}
      <Section icon="solar:layers-minimalistic-linear" title="What's on a product's page">
        <p>
          Opening a product shows its photos alongside a set of tabs. You
          don&apos;t have to edit to look — the page is a read-only overview until
          you click <b>Edit Product</b>.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MiniCard icon="solar:info-circle-linear" title="Overview">
            The essentials — name, description, brand, category, and status at a
            glance.
          </MiniCard>
          <MiniCard icon="solar:tag-price-linear" title="Pricing & Inventory">
            The selling price, cost, and how many are in stock.
          </MiniCard>
          <MiniCard icon="solar:list-linear" title="Specifications">
            The technical details — processor, memory, screen size, and so on.
          </MiniCard>
          <MiniCard icon="solar:cpu-bolt-linear" title="Parts">
            The parts that belong to this product. Adding parts has its own guide.
          </MiniCard>
        </div>
      </Section>

      {/* Status */}
      <Section icon="solar:power-linear" title="Live, hidden & featured">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MiniCard icon="solar:check-circle-linear" title="Live">
            <b>Live Status</b> on — the product shows on the storefront and can be
            bought.
          </MiniCard>
          <MiniCard icon="solar:forbidden-circle-linear" title="Hidden">
            Live Status off — kept in the catalogue but not shown to customers.
            Handy while you finish setting it up.
          </MiniCard>
          <MiniCard icon="solar:star-linear" title="Featured">
            Highlighted in storefront collections. A product can be featured only
            once it&apos;s live.
          </MiniCard>
        </div>
        <Callout tone="tip" title="Set it up hidden, publish when ready">
          New products start hidden so nothing goes live half-finished. Add the
          photos, double-check the price, then switch Live Status on.
        </Callout>
      </Section>

      {/* Field reference */}
      <Section icon="solar:list-linear" title="What each field means">
        <FieldTable
          rows={[
            ["Product Name", "What the product is called, shown to customers."],
            ["Slug", "The web-address version of the name — filled in for you."],
            ["Category / Brand", "How the product is grouped and filtered."],
            ["Description", "A short summary customers read (at least 10 characters)."],
            ["Part Number (SKU)", "The product's unique code, used to identify it."],
            ["Condition", "New, Refurbished, Used, or Open Box."],
            ["Price", "What the customer pays."],
            ["Cost", "What you paid — used to work out profit and markup."],
            ["Stock", "How many you have available to sell."],
            ["Threshold", "The stock level at which it's flagged as “low”."],
            ["Live Status", "On = visible to customers; off = hidden."],
            ["Featured", "Highlights the product in storefront collections."],
          ]}
        />
      </Section>
    </>
  );
}
