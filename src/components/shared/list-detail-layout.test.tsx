// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ListDetailLayout } from "./list-detail-layout";

afterEach(cleanup);

function layout(hasSelection: boolean) {
  render(
    <ListDetailLayout
      list={<p>the list</p>}
      detail={<p>the detail</p>}
      hasSelection={hasSelection}
      backHref="/pricing/deals"
      backLabel="All deals"
    />,
  );
  return {
    list: screen.getByText("the list").parentElement!,
    detail: screen.getByText("the detail").parentElement!,
  };
}

describe("ListDetailLayout", () => {
  it("shows the list on a phone and no Back link when nothing is selected", () => {
    const { list, detail } = layout(false);
    expect(list.className).not.toContain("max-lg:hidden");
    expect(detail.className).toContain("max-lg:hidden");
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("swaps to the detail with a Back link to the bare route when selected", () => {
    const { list, detail } = layout(true);
    expect(list.className).toContain("max-lg:hidden");
    expect(detail.className).not.toContain("max-lg:hidden");
    expect(screen.getByRole("link", { name: "All deals" }).getAttribute("href")).toBe(
      "/pricing/deals",
    );
  });
});
