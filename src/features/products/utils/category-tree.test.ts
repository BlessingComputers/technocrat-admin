import { describe, expect, it } from "vitest";
import type { ProductCategory } from "../types/products";
import { findCategoryBySlug } from "./category-tree";

const cat = (id: string, slug: string, children?: ProductCategory[]) =>
  ({ id, name: slug.toUpperCase(), slug, children }) as unknown as ProductCategory;

const workstations = cat("c2", "workstations");
const tree = [cat("c1", "laptops"), cat("c3", "desktops", [workstations])];

describe("findCategoryBySlug", () => {
  it("finds a top-level category with no parent", () => {
    expect(findCategoryBySlug("laptops", tree)).toEqual({
      category: tree[0],
    });
  });

  it("finds a subcategory with its parent", () => {
    expect(findCategoryBySlug("workstations", tree)).toEqual({
      category: workstations,
      parent: tree[1],
    });
  });

  it("returns undefined for an unknown slug or no slug", () => {
    expect(findCategoryBySlug("phones", tree)).toBeUndefined();
    expect(findCategoryBySlug(undefined, tree)).toBeUndefined();
  });
});
