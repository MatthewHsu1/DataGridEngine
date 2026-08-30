import { GridCellKind } from "@glideapps/glide-data-grid";
import { describe, expect, it } from "vitest";
import {
  glideBooleanCellDef,
  glideBubbleCellDef,
  glideDrilldownCellDef,
  glideImageCellDef,
  glideMarkdownCellDef,
  glideNumberCellDef,
  glideTextCellDef,
  glideUriCellDef,
} from "./glideCells";

const editable = { editable: true, options: undefined };
const readOnly = { editable: false, options: undefined };

describe("glide text", () => {
  it("builds a plain glide TextCell", () => {
    expect(glideTextCellDef.make("hi", editable)).toEqual({
      kind: GridCellKind.Text,
      data: "hi",
      displayData: "hi",
      allowOverlay: true,
      readonly: false,
    });
  });

  it("reads a null row value as an empty string, never as the text 'null'", () => {
    expect(glideTextCellDef.make(null, editable)).toMatchObject({ data: "", displayData: "" });
  });

  it("closes the overlay for a read-only column", () => {
    expect(glideTextCellDef.make("hi", readOnly)).toMatchObject({
      allowOverlay: false,
      readonly: true,
    });
  });
});

describe("glide number", () => {
  it("coerces the row value and displays it", () => {
    expect(glideNumberCellDef.make("42", editable)).toMatchObject({
      kind: GridCellKind.Number,
      data: 42,
      displayData: "42",
    });
  });

  it("reads null and empty string as no number at all", () => {
    expect(glideNumberCellDef.make(null, editable)).toMatchObject({
      data: undefined,
      displayData: "",
    });
    expect(glideNumberCellDef.make("", editable)).toMatchObject({ data: undefined });
  });
});

describe("glide boolean", () => {
  it("never opens an overlay, because glide's checkbox has none", () => {
    expect(glideBooleanCellDef.make(true, editable)).toEqual({
      kind: GridCellKind.Boolean,
      data: true,
      allowOverlay: false,
      readonly: false,
    });
  });

  it("keeps a null row value null rather than reading it as false", () => {
    expect(glideBooleanCellDef.make(null, editable)).toMatchObject({ data: null });
  });

  it("blocks the toggle on a read-only column", () => {
    expect(glideBooleanCellDef.make(true, readOnly)).toMatchObject({ readonly: true });
  });
});

describe("glide uri and markdown", () => {
  it("builds a Uri cell", () => {
    expect(glideUriCellDef.make("https://example.com", editable)).toMatchObject({
      kind: GridCellKind.Uri,
      data: "https://example.com",
    });
  });

  it("builds a Markdown cell", () => {
    expect(glideMarkdownCellDef.make("# hi", editable)).toMatchObject({
      kind: GridCellKind.Markdown,
      data: "# hi",
    });
  });
});

describe("glide image, bubble, and drilldown", () => {
  it("takes a list straight from the row", () => {
    expect(glideImageCellDef.make(["a.png", "b.png"], editable)).toMatchObject({
      kind: GridCellKind.Image,
      data: ["a.png", "b.png"],
    });
  });

  it("wraps a lone value, so a one-string row field needs no mapping", () => {
    expect(glideImageCellDef.make("a.png", editable)).toMatchObject({ data: ["a.png"] });
    expect(glideBubbleCellDef.make("one", editable)).toMatchObject({ data: ["one"] });
  });

  it("reads a null row value as an empty list", () => {
    expect(glideImageCellDef.make(null, editable)).toMatchObject({ data: [] });
  });

  it("drops nulls inside a list rather than drawing 'null'", () => {
    expect(glideBubbleCellDef.make(["a", null, "b"], editable)).toMatchObject({
      data: ["a", "b"],
    });
  });

  it("shapes drilldown items the way glide wants them", () => {
    expect(glideDrilldownCellDef.make(["one", "two"], editable)).toMatchObject({
      kind: GridCellKind.Drilldown,
      data: [{ text: "one" }, { text: "two" }],
    });
  });

  it("never edits, whatever the column says", () => {
    for (const def of [glideImageCellDef, glideBubbleCellDef, glideDrilldownCellDef]) {
      expect(def.make("x", editable).allowOverlay).toBe(false);
    }
  });
});
