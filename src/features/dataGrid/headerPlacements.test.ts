import { describe, expect, it } from "vitest";
import { headerPlacements, type CanvasGeometry } from "./headerPlacements";
import type { VisibleHeader } from "./displayModel";

const HEADERS: VisibleHeader<string>[] = [
  { displayRow: 0, group: "EMEA", collapsed: false },
  { displayRow: 5, group: "Americas", collapsed: false },
];

const HEADER_HEIGHT = 36;

/** Every row 34 tall, the two group headers 44. */
const heightOf = (row: number) => (row === 0 || row === 5 ? 44 : 34);

const geometry = (over: Partial<CanvasGeometry> = {}): CanvasGeometry => ({
  firstRow: 0,
  translateY: 0,
  headerHeight: HEADER_HEIGHT,
  heightOf,
  ...over,
});

describe("headerPlacements", () => {
  it("puts the first visible row directly under the column headers", () => {
    expect(headerPlacements(HEADERS, geometry()).get(0)?.top).toBe(36);
  });

  it("stacks the rows between the top of the view and the header", () => {
    // Row 0 is a 44-tall header, rows 1 to 4 are 34 each: 44 + 136 = 180.
    expect(headerPlacements(HEADERS, geometry()).get(5)?.top).toBe(36 + 180);
  });

  it("follows the scroll within a row, which is what a fast scroll is made of", () => {
    // `ty` is the sub-row offset glide reports with the region. Reading the
    // position back off the canvas instead lands a frame behind, because glide
    // has not re-rendered when it calls us — that is a header sliding off its
    // band whenever the scroll is quick.
    expect(headerPlacements(HEADERS, geometry({ translateY: -17 })).get(0)?.top).toBe(19);
  });

  it("places a header the view has scrolled up past, at a negative offset", () => {
    // Viewport starts at row 5; row 0's header is above it by 44 + 34*4.
    expect(headerPlacements(HEADERS, geometry({ firstRow: 5 })).get(0)?.top).toBe(36 - 180);
  });

  it("covers its own row exactly, and not a pixel of the row beneath", () => {
    // It used to take one pixel more, to hide the border glide draws under the
    // row. That pixel is where the row below draws the TOP edge of its
    // selection ring, so a selected cell directly under a group header looked
    // like it had no top border.
    expect(headerPlacements(HEADERS, geometry()).get(0)?.height).toBe(44);
  });

  it("answers an empty map for a grid with no headers on screen", () => {
    expect(headerPlacements([], geometry()).size).toBe(0);
  });
});
