// @vitest-environment jsdom
/**
 * Contract v4 attaches catalogue-verified product cards to an AI reply. These
 * pin the two things that are easy to get wrong on a staff-facing card: the
 * price treatment (no `basePrice` on this payload, so no discount strike and
 * no ₦0 for a missing price) and the fact that it opens the storefront in a
 * new tab rather than navigating the admin away from a live thread.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChatProductCards } from "./chat-product-cards";
import type { ChatProductCard } from "../types/chat";

function product(overrides: Partial<ChatProductCard> = {}): ChatProductCard {
  return {
    id: "pc1",
    productId: "p1",
    slug: "hp-elitebook-840",
    name: "HP EliteBook 840 G8",
    description: null,
    primaryImage: null,
    brand: { name: "HP", slug: "hp" },
    category: { name: "Laptops", slug: "laptops" },
    lowestPrice: 450_000,
    highestPrice: 450_000,
    availabilityStatus: "IN_STOCK",
    url: "https://blessingcomputers.com/product/hp-elitebook-840",
    ...overrides,
  };
}

describe("ChatProductCards", () => {
  it("renders name, brand, price and availability", () => {
    render(<ChatProductCards products={[product()]} />);

    expect(screen.getByText("HP EliteBook 840 G8")).toBeTruthy();
    expect(screen.getByText("HP")).toBeTruthy();
    expect(screen.getByText("₦450,000")).toBeTruthy();
    expect(screen.getByText("In stock")).toBeTruthy();
  });

  it("opens the storefront in a new tab, so the agent keeps the thread", () => {
    render(<ChatProductCards products={[product()]} />);

    const card = screen.getByRole("link", { name: /HP EliteBook 840 G8/ });
    expect(card.getAttribute("href")).toBe(
      "https://blessingcomputers.com/product/hp-elitebook-840",
    );
    expect(card.getAttribute("target")).toBe("_blank");
    expect(card.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("shows a range when the variants are not all one price", () => {
    render(
      <ChatProductCards
        products={[product({ lowestPrice: 450_000, highestPrice: 620_000 })]}
      />,
    );

    expect(screen.getByText("₦450,000 – ₦620,000")).toBeTruthy();
  });

  // Rendering ₦0 would read as a free product rather than as missing data.
  it("says no price is set rather than rendering zero", () => {
    render(
      <ChatProductCards
        products={[product({ lowestPrice: null, highestPrice: null })]}
      />,
    );

    expect(screen.getByText("No price set")).toBeTruthy();
    expect(screen.queryByText("₦0")).toBeNull();
  });

  // An unrecognised status is not a licence to imply the thing is buyable.
  it("does not imply availability for a status it does not know", () => {
    render(
      <ChatProductCards
        products={[product({ availabilityStatus: "SOMETHING_NEW" })]}
      />,
    );

    expect(screen.getByText("Availability unknown")).toBeTruthy();
  });

  it("renders nothing for an empty or absent list", () => {
    const { container, rerender } = render(<ChatProductCards products={[]} />);
    expect(container.firstChild).toBeNull();

    rerender(<ChatProductCards products={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders one entry per product", () => {
    render(
      <ChatProductCards
        products={[
          product(),
          product({ id: "pc2", name: "Dell Latitude 7420", slug: "dell-7420" }),
        ]}
      />,
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});
