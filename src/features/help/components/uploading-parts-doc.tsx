import {
  Section,
  Path,
  Steps,
  Tile,
  MiniCard,
  Callout,
  FieldTable,
} from "./doc-kit";

/**
 * "Uploading & Managing Parts" documentation. Written for non-technical staff —
 * plain language, visual, step-by-step. Presentation-only. Composes entirely
 * from the shared Doc Kit (ADR-0011).
 */
export function UploadingPartsDoc() {
  return (
    <>
      {/* Intro */}
      <Section icon="solar:cpu-bolt-linear" title="What is a part?">
        <p>
          A <b>part</b> is a component that belongs to a product — like a{" "}
          <b>charger</b>, <b>keyboard</b>, <b>screen</b>, or <b>battery</b>.
          Unlike products, parts aren&apos;t browsed on their own shelf; each one
          belongs to a specific product. A single laptop, for example, can have
          its own battery, keyboard, and screen listed as parts.
        </p>
        <p>
          The thing that ties a part to its product is the product&apos;s{" "}
          <b>part number</b>. Every product has a unique part number, and its
          parts carry that same number so the system knows they belong together.
          You don&apos;t have to manage this by hand — it&apos;s filled in for you
          when you add a part from a product.
        </p>
      </Section>

      {/* Two ways */}
      <Section icon="solar:routing-2-linear" title="Two ways to add parts">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Tile
            icon="solar:box-linear"
            tone="primary"
            title="From a product"
            body="Open a product and add its parts one at a time. Best when you're adding a part or two to a specific product."
          />
          <Tile
            icon="solar:cloud-upload-linear"
            tone="success"
            title="Bulk upload"
            body="Add many parts at once — or paste a supplier list and let AI organise it for you. Also the quickest way to add a single part."
          />
        </div>
      </Section>

      {/* Add from a product */}
      <Section
        icon="solar:box-linear"
        title="Adding a part to a product"
        subtitle="The everyday way to add one part."
      >
        <Path items={["Products", "Open a product", "Parts tab", "Add Part"]} />
        <Steps
          steps={[
            {
              title: "Open the product",
              body: "Go to Products, find the product the part belongs to, and open it.",
            },
            {
              title: "Go to the Parts tab",
              body: "On the product page, click the Parts tab. You'll see any parts already added, grouped by type.",
            },
            {
              title: 'Click "Add Part"',
              body: "This opens a form to create a new part for this product. The category, brand, and part number are already filled in from the product — you don't need to re-enter them.",
            },
            {
              title: "Fill in the details",
              body: "Give the part a name, choose its Part Type (charger, screen…), set a price and stock, and add any specifications. Only the name, part type, category, and brand are required.",
            },
            {
              title: "Add photos",
              body: "In the same form, add the part's photos and pick the main image customers see first. There's no need to save the part first — they upload when you save.",
            },
            {
              title: "Save",
              body: "The part is created — together with its photos — and automatically linked to the product. You'll come back to the product, where it now appears under its type.",
            },
          ]}
        />
        <Callout tone="tip" title="Why the category and brand are pre-filled">
          A part belongs to a product, so it makes sense for it to share the
          product&apos;s category and brand. They&apos;re filled in automatically
          — but you can change them if a part is genuinely different.
        </Callout>
      </Section>

      {/* Attach existing */}
      <Section icon="solar:link-linear" title="Attaching a part that already exists">
        <p>
          Sometimes a part you&apos;ve already created also fits another product.
          Instead of creating it again, you can attach the existing one.
        </p>
        <Path items={["Products", "Open a product", "Parts tab", "Attach existing"]} />
        <Steps
          steps={[
            {
              title: 'Click "Attach existing"',
              body: "On the product's Parts tab, choose Attach existing.",
            },
            {
              title: "Search and pick",
              body: "Search by name or part number, tick the parts you want, and attach them. Parts already on this product are shown as greyed-out.",
            },
          ]}
        />
      </Section>

      {/* Bulk upload */}
      <Section
        icon="solar:cloud-upload-linear"
        title="Bulk uploading parts"
        subtitle="Add many parts in one go — with optional AI help."
      >
        <Path items={["Products", "Parts", "Bulk Upload"]} />
        <Steps
          steps={[
            {
              title: "Open Bulk Upload",
              body: "Go to Products → All parts → Bulk Upload. You'll see a page where each part is a row.",
            },
            {
              title: "Paste a list, or add rows",
              body: 'Paste a supplier\'s parts list into the "Smart paste" box and click Parse with AI — it turns the text into ready-to-review rows. Or click "Add Row" to type parts in manually.',
            },
            {
              title: "Review each row",
              body: "Check the details on every row — name, part type, category, brand, price, stock. Rows that still need attention are flagged so you can fix them before uploading.",
            },
            {
              title: "Set a markup (optional)",
              body: "The Markup % box adds a percentage on top of each cost price to work out the selling price. Change it and every row's price updates.",
            },
            {
              title: "Add photos (optional)",
              body: "Each row has an image button to attach photos and mark a main one.",
            },
            {
              title: "Upload",
              body: 'Click "Upload" — the parts are created in the background. You\'ll see progress, and a summary when it finishes. Anything that failed stays on screen so you can retry it.',
            },
          ]}
        />
        <Callout tone="tip" title="Smart paste with AI">
          Paste a messy supplier list and the AI reads it into tidy rows —
          guessing the name, part type, category, brand, price, and specs. Always
          give the rows a quick review before uploading; the AI leaves anything
          it&apos;s unsure about blank for you to fill.
        </Callout>
        <Callout tone="note" title="Great for a single part too">
          Bulk upload isn&apos;t only for big lists. Adding one part? Click{" "}
          <b>Add Row</b>, fill it in, and upload — it&apos;s the fastest way to
          create a standalone part.
        </Callout>
        <Callout tone="warn" title="Uploads start as drafts">
          New parts are created <b>inactive</b> (a draft), so nothing goes live
          before you&apos;ve checked the price. Activate a part when you&apos;re
          ready for customers to see it.
        </Callout>
      </Section>

      {/* Part types */}
      <Section icon="solar:widget-5-linear" title="Part types">
        <p>
          A <b>part type</b> is the kind of part — charger, keyboard, screen,
          battery, and so on. Types keep parts organised and let customers filter.
          You pick a type when creating a part, so it helps to set them up first.
        </p>
        <Path items={["Products", "Brands & Categories", "Part Types"]} />
        <p>
          On that tab, type a name (e.g. &ldquo;Charger&rdquo;) and click Add. New
          types appear immediately in the part forms.
        </p>
      </Section>

      {/* Pricing */}
      <Section icon="solar:tag-price-linear" title="Pricing & markup rules">
        <p>
          A <b>markup rule</b> sets prices automatically by adding a percentage on
          top of cost. Instead of pricing every part by hand, you make a rule like
          &ldquo;add 25% to all Battery parts&rdquo; and apply it.
        </p>
        <Path items={["Products", "All parts", "Pricing"]} />
        <Steps
          steps={[
            {
              title: 'Create a rule',
              body: "Click New Rule. Choose what it applies to — a category, a brand, a part type, or a mix — set the percentage, and save.",
            },
            {
              title: "Preview before applying",
              body: 'Use "Preview & apply" to see exactly which parts change and their new prices — nothing is saved yet.',
            },
            {
              title: "Apply",
              body: "Happy with the preview? Apply it, and the matching parts are repriced.",
            },
            {
              title: "Undo if needed",
              body: '"Reset prices" puts prices back to base but keeps the rule; "Cancel & reset" also switches the rule off.',
            },
          ]}
        />
      </Section>

      {/* Managing */}
      <Section icon="solar:pen-2-linear" title="Editing, deactivating & removing">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MiniCard icon="solar:pen-2-linear" title="Edit">
            Open a part and change any detail — from a product&apos;s Parts tab or
            the All Parts list.
          </MiniCard>
          <MiniCard icon="solar:forbidden-circle-linear" title="Deactivate">
            Hides a part from customers but keeps it in the system. Reactivate any
            time.
          </MiniCard>
          <MiniCard icon="solar:link-broken-linear" title="Remove from product">
            Unlinks a part from a product. The part itself isn&apos;t deleted and
            can be re-attached.
          </MiniCard>
        </div>
      </Section>

      {/* Field reference */}
      <Section icon="solar:list-linear" title="What each field means">
        <FieldTable
          rows={[
            ["Name", "What the part is called, shown to customers."],
            ["Part number", "The manufacturer's code for the part (optional)."],
            ["Part type", "The kind of part — charger, screen, battery…"],
            ["Category / Brand", "Inherited from the product; groups the part."],
            ["Owner SKU", "The product's part number — links the part to its product."],
            ["Selling price", "What the customer pays. Leave blank for “price on request”."],
            ["Cost price", "What the part costs you — used to work out markup."],
            ["Stock", "How many you have; “In stock” controls whether it can be bought."],
            ["Specifications", "Extra details like material or capacity."],
            ["Active / Featured", "Active = visible to customers; Featured = highlighted."],
          ]}
        />
      </Section>
    </>
  );
}
