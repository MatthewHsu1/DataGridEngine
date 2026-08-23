import { GridCellKind, type Theme } from "@glideapps/glide-data-grid";
import { describe, expect, it } from "vitest";
import { groupHeaderHole } from "./groupHeaderHole";

const LIGHT: Partial<Theme> = { bgHeader: "#F7F9FA", textHeader: "#4A4A52" };
const DARK: Partial<Theme> = { bgHeader: "#161719", textHeader: "#A0A5AD" };

describe("groupHeaderHole", () => {
  it("spans every column, so no cell border cuts across the header above it", () => {
    expect(groupHeaderHole(4, LIGHT).span).toEqual([0, 3]);
  });

  it("draws no text, because the React header on top of it draws the name", () => {
    const cell = groupHeaderHole(4, LIGHT);

    expect(cell.kind).toBe(GridCellKind.Text);
    expect(cell).toMatchObject({ data: "", displayData: "" });
  });

  it("never opens an overlay, because a header holds nothing to edit", () => {
    expect(groupHeaderHole(4, LIGHT).allowOverlay).toBe(false);
  });

  it("fills from the theme's header background, not a fixed colour", () => {
    // The layer paints its own background, but the canvas paints FIRST. An
    // unfilled hole would flash the ordinary cell fill on every scroll frame
    // React has not caught up with yet.
    expect(groupHeaderHole(4, LIGHT).themeOverride?.bgCell).toBe("#F7F9FA");
    expect(groupHeaderHole(4, DARK).themeOverride?.bgCell).toBe("#161719");
  });

  it("does not collapse the span below zero for a grid with no columns", () => {
    expect(groupHeaderHole(0, LIGHT).span).toEqual([0, 0]);
  });
});
