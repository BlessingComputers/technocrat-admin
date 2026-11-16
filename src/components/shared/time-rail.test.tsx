// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { RailAxis, TimeRail } from "./time-rail";

afterEach(cleanup);

const range = { start: 0, end: 1000 };

function rail(props: Partial<Parameters<typeof TimeRail>[0]> = {}) {
  const { container } = render(
    <TimeRail range={range} start={100} end={600} now={350} label="Runs" {...props} />,
  );
  return {
    used: container.querySelector<HTMLElement>(".h-1.bg-info"),
    tick: container.querySelector<HTMLElement>(".h-2.bg-info"),
    dot: container.querySelector<HTMLElement>(".border-primary"),
    html: container.innerHTML,
  };
}

describe("TimeRail", () => {
  it("fills used time up to the Now dot and draws the end tick", () => {
    const { used, tick, dot } = rail();
    expect(used?.style.width).toBe("25%");
    expect(dot?.style.left).toBe("35%");
    expect(tick?.style.left).toBe("60%");
  });

  it("fills the whole span when now is past the range (deal past expiresAt)", () => {
    const { used, dot } = rail({ start: 100, end: 1000, now: 1300 });
    expect(used?.style.width).toBe("90%");
    expect(dot).toBeNull();
  });

  it("draws no end tick for an open end", () => {
    expect(rail({ end: null }).tick).toBeNull();
  });

  it("draws one pale span and no Now dot when upcoming", () => {
    const { used, dot } = rail({ upcoming: true, start: 500, end: 900 });
    expect(used).toBeNull();
    expect(dot).toBeNull();
  });

  it("draws nothing but the track for an empty range", () => {
    const { used, dot, html } = rail({ range: { start: 10, end: 10 } });
    expect(used).toBeNull();
    expect(dot).toBeNull();
    expect(html).not.toMatch(/NaN|Infinity/);
  });

  it("keeps markers on the range edges and drops ones outside", () => {
    const { container } = render(
      <TimeRail
        range={range}
        start={0}
        end={1000}
        now={500}
        label="Window"
        markers={[
          { at: 0, className: "mark" },
          { at: 1000, className: "mark" },
          { at: 1001, className: "mark" },
        ]}
      />,
    );
    const lefts = [...container.querySelectorAll<HTMLElement>(".mark")].map((m) => m.style.left);
    expect(lefts).toEqual(["0%", "100%"]);
  });

  it("names itself for screen readers", () => {
    rail({ label: "Runs 8 to 25 Nov, 12 days left" });
    expect(screen.getByRole("img", { name: "Runs 8 to 25 Nov, 12 days left" })).toBeTruthy();
  });
});

describe("RailAxis", () => {
  it("prints one formatted label per tick", () => {
    const { container } = render(<RailAxis range={range} count={3} format={(t) => `t${t}`} />);
    expect(container.textContent).toBe("t0t500t1000");
  });
});
