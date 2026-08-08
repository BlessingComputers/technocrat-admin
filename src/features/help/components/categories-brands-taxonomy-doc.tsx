import {
  Section,
  Path,
  Steps,
  StepCard,
  StepPoint,
  Bento,
  MiniCard,
  Callout,
} from "./doc-kit";

/**
 * "Categories & Brands" walkthrough (ADR-0012) for `/catalogues/taxonomy`.
 * Explains the category tree (categories → subcategories) and brands, and how
 * products hang off them. Bento overview then vertical spine detail. Written for
 * non-technical staff; presentation-only, composes from the Doc Kit.
 */
export function CategoriesBrandsTaxonomyDoc() {
  return (
    <>
      {/* Intro */}
      <Section icon="solar:folder-linear" title="How the catalogue is organised">
        <p>
          Every product belongs to a <b>category</b> (like Laptops or Printers)
          and a <b>brand</b> (like HP or Dell). Together they&apos;re how
          customers browse and filter the shop — and how you keep the catalogue
          tidy. This is where you set them up.
        </p>
        <p>
          Categories can have <b>subcategories</b> beneath them — for example{" "}
          <b>Laptops</b> might contain <b>Gaming</b> and <b>Business</b>. Brands
          are a simple flat list. You&apos;ll pick a category and brand for every
          product you create, so it helps to have them ready first.
        </p>
        <Path items={["Catalogue", "Brands & Categories"]} />
      </Section>

      {/* The two tabs — bento overview */}
      <Section
        icon="solar:routing-2-linear"
        title="Two tabs, two jobs"
        subtitle="Categories build the tree; Brands list the makers."
      >
        <Bento>
          <StepCard
            n={1}
            span={7}
            tone="muted"
            bgIcon="solar:folder-linear"
            title="Categories"
          >
            <p>
              The <b>category tree</b>. The left panel lists your top-level
              categories; pick one to manage its subcategories on the right. Each
              category shows how many products it holds.
            </p>
            <ul className="mt-3 space-y-2">
              <StepPoint icon="solar:add-circle-linear">Add a category or subcategory</StepPoint>
              <StepPoint icon="solar:pen-2-linear">Rename or edit one</StepPoint>
              <StepPoint icon="solar:trash-bin-trash-linear">Remove an empty one</StepPoint>
            </ul>
          </StepCard>

          <StepCard
            n={2}
            span={5}
            tone="inverted"
            bgIcon="solar:tag-linear"
            title="Brands"
          >
            <p>
              A grid of the makers you stock. Add, edit, or remove a brand — each
              can carry a logo so it looks right on the storefront.
            </p>
          </StepCard>
        </Bento>
      </Section>

      {/* Categories */}
      <Section
        icon="solar:folder-linear"
        title="Managing categories"
        subtitle="Top-level categories and the subcategories beneath them."
      >
        <Path items={["Brands & Categories", "Categories"]} />
        <Steps
          steps={[
            {
              title: "Add a top-level category",
              body: 'On the Categories tab, click Add on the left panel. Give it a name (and a picture if you like), then save. It appears in the list with a product count of zero.',
            },
            {
              title: "Add subcategories",
              body: "Click a category to select it, then use Add on the right panel to create subcategories inside it — Gaming and Business under Laptops, for example.",
            },
            {
              title: "Edit or rename",
              body: "Hover a row and use the pencil to rename a category or subcategory, or change its picture.",
            },
            {
              title: "Remove one",
              body: "Use the bin icon to delete. A category or subcategory that still has products can't be deleted — move those products elsewhere first.",
            },
          ]}
        />
        <Callout tone="warn" title="Categories with products can't be deleted">
          If a category still holds products, deleting is blocked with a note to
          reassign or remove them first. This is on purpose — it stops products
          being orphaned. Reassign the products to another category, then delete.
        </Callout>
      </Section>

      {/* Brands */}
      <Section
        icon="solar:tag-linear"
        title="Managing brands"
        subtitle="The manufacturers you stock."
      >
        <Path items={["Brands & Categories", "Brands"]} />
        <Steps
          steps={[
            {
              title: "Add a brand",
              body: 'Switch to the Brands tab and click "Add Brand". Enter the name and, if you have one, upload the brand\'s logo. Save.',
            },
            {
              title: "Edit a brand",
              body: "Each brand is a card — use its edit action to change the name or logo.",
            },
            {
              title: "Remove a brand",
              body: "Delete a brand you no longer stock. Products that used it keep all their details — they just lose the brand label, so re-assign them to the right brand afterwards.",
            },
          ]}
        />
        <Callout tone="note" title="Deleting a brand is gentler than a category">
          Unlike categories, a brand can be removed even while products use it —
          those products simply lose the brand association rather than blocking
          the delete. Tidy them up afterwards so nothing is left brand-less.
        </Callout>
      </Section>

      {/* How it fits together */}
      <Section icon="solar:box-linear" title="How products use them">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MiniCard icon="solar:folder-linear" title="Category & subcategory">
            Chosen on every product. Decides where it sits in the browse tree.
          </MiniCard>
          <MiniCard icon="solar:tag-linear" title="Brand">
            Also chosen per product. Lets customers filter by manufacturer.
          </MiniCard>
          <MiniCard icon="solar:tag-price-linear" title="Pricing scope">
            Markup rules are scoped by category and brand — another reason to keep
            them tidy. See the Pricing guide.
          </MiniCard>
        </div>
        <Callout tone="tip" title="Set these up before a big upload">
          Because you pick a category and brand for every product, having them
          ready first makes both single and bulk uploads much quicker — the AI can
          match products straight to categories and brands that already exist.
        </Callout>
      </Section>

      {/* Part types pointer */}
      <Section icon="solar:widget-5-linear" title="Looking for Part Types?">
        <p>
          Part <b>types</b> (charger, screen, battery…) aren&apos;t here — they
          live with Parts, under <b>Products → Parts → Part Types</b>. They&apos;re
          covered in the <b>Uploading &amp; Managing Parts</b> guide.
        </p>
        <Path items={["Products", "Parts", "Part Types"]} />
      </Section>
    </>
  );
}
