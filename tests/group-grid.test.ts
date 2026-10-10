import { describe, expect, it } from "vitest";
import {
  buildGroupGrid,
  parseGroupName,
  type GroupGridCell,
  type GroupGridInput,
} from "../src/lib/tournaments/group-grid";

function cellFor<T extends GroupGridInput>(
  cells: GroupGridCell<T>[],
  id: string,
): GroupGridCell<T> | undefined {
  return cells.find((cell) => cell.item?.id === id);
}

describe("parseGroupName", () => {
  it("splits a base name from its trailing row number", () => {
    expect(parseGroupName("Red Ants 1")).toEqual({
      base: "Red Ants",
      index: 1,
      rotation: false,
      parts: [],
    });
    expect(parseGroupName("Blue Ants 2")).toEqual({
      base: "Blue Ants",
      index: 2,
      rotation: false,
      parts: [],
    });
  });

  it("defaults the row to 1 when there is no trailing number", () => {
    expect(parseGroupName("Final Stage")).toEqual({
      base: "Final Stage",
      index: 1,
      rotation: false,
      parts: [],
    });
  });

  it("keeps multi-digit trailing numbers as part of the base (e.g. years)", () => {
    expect(parseGroupName("Season 2024")).toEqual({
      base: "Season 2024",
      index: 1,
      rotation: false,
      parts: [],
    });
  });

  it("detects rotation names referencing two groups", () => {
    expect(parseGroupName("Red 2 <-> Black 1")).toEqual({
      base: "Red 2 <-> Black 1",
      index: 1,
      rotation: true,
      parts: [
        { base: "Red", index: 2 },
        { base: "Black", index: 1 },
      ],
    });
  });

  it("detects rotation names using the 🔄 emoji separator", () => {
    expect(parseGroupName("Gold Ants 2 🔄 Red Ants 1")).toEqual({
      base: "Gold Ants 2 🔄 Red Ants 1",
      index: 1,
      rotation: true,
      parts: [
        { base: "Gold Ants", index: 2 },
        { base: "Red Ants", index: 1 },
      ],
    });
  });

  it("ignores a variation selector after the rotation emoji", () => {
    expect(parseGroupName("Gold Ants 2 🔄️ Red Ants 1")).toEqual({
      base: "Gold Ants 2 🔄️ Red Ants 1",
      index: 1,
      rotation: true,
      parts: [
        { base: "Gold Ants", index: 2 },
        { base: "Red Ants", index: 1 },
      ],
    });
  });
});

describe("buildGroupGrid", () => {
  const example: GroupGridInput[] = [
    { id: "red1", name: "Red Ants 1" },
    { id: "red2", name: "Red Ants 2" },
    { id: "black1", name: "Black Ants 1" },
    { id: "blue1", name: "Blue Ants 1" },
    { id: "blue2", name: "Blue Ants 2" },
  ];

  it("lays out columns by base name and rows by number", () => {
    const layout = buildGroupGrid(example);

    expect(layout.columns).toBe(3);
    expect(layout.rows).toBe(2);

    expect(cellFor(layout.cells, "red1")).toMatchObject({
      columnStart: 1,
      columnSpan: 1,
      row: 1,
    });
    expect(cellFor(layout.cells, "black1")).toMatchObject({
      columnStart: 2,
      columnSpan: 1,
      row: 1,
    });
    expect(cellFor(layout.cells, "blue1")).toMatchObject({
      columnStart: 3,
      columnSpan: 1,
      row: 1,
    });
    expect(cellFor(layout.cells, "red2")).toMatchObject({
      columnStart: 1,
      row: 2,
    });
    expect(cellFor(layout.cells, "blue2")).toMatchObject({
      columnStart: 3,
      row: 2,
    });
  });

  it("fills the gaps with empty placeholders", () => {
    const layout = buildGroupGrid(example);

    // 5 groups + 1 empty slot (row 2, column 2)
    expect(layout.cells).toHaveLength(6);
    expect(layout.cells.find((cell) => cell.key === "empty-2-2")).toMatchObject(
      { item: null, columnStart: 2, row: 2 },
    );
  });

  it("orders columns by the order the groups are provided", () => {
    const reordered = buildGroupGrid([
      { id: "blue1", name: "Blue Ants 1" },
      { id: "red1", name: "Red Ants 1" },
      { id: "black1", name: "Black Ants 1" },
    ]);

    expect(cellFor(reordered.cells, "blue1")?.columnStart).toBe(1);
    expect(cellFor(reordered.cells, "red1")?.columnStart).toBe(2);
    expect(cellFor(reordered.cells, "black1")?.columnStart).toBe(3);
  });

  it("places a rotation group in the column of its first group", () => {
    const layout = buildGroupGrid([
      ...example,
      { id: "rotation", name: "Red 2 <-> Black 1" },
    ]);

    expect(layout.rows).toBe(3);
    expect(cellFor(layout.cells, "rotation")).toMatchObject({
      columnStart: 1,
      columnSpan: 1,
      row: 3,
      rotation: true,
    });

    // Columns 2 and 3 on the rotation row are padded with placeholders.
    expect(layout.cells.find((cell) => cell.key === "empty-3-2")).toMatchObject(
      { item: null, columnStart: 2, row: 3 },
    );
    expect(layout.cells.find((cell) => cell.key === "empty-3-3")).toMatchObject(
      { item: null, columnStart: 3, row: 3 },
    );
  });

  it("blends the colors of the two referenced groups", () => {
    const layout = buildGroupGrid([
      { id: "gold1", name: "Gold Ants 1", color: "#d4af37" },
      { id: "gold2", name: "Gold Ants 2", color: "#d4af37" },
      { id: "red1", name: "Red Ants 1", color: "#c0392b" },
      { id: "rotation", name: "Gold Ants 2 🔄 Red Ants 1" },
    ]);

    expect(cellFor(layout.cells, "rotation")).toMatchObject({
      columnStart: 1,
      columnSpan: 1,
      row: 3,
      rotation: true,
      rotationColors: ["#d4af37", "#c0392b"],
    });
  });

  it("treats a group flagged as rotational as a rotation group", () => {
    const layout = buildGroupGrid([
      { id: "gold1", name: "Gold Ants 1" },
      { id: "red1", name: "Red Ants 1" },
      { id: "rotation", name: "Playoffs", isRotational: true },
    ]);

    const rotation = cellFor(layout.cells, "rotation");
    expect(rotation).toMatchObject({ rotation: true, columnSpan: 1 });
    // No parseable references -> falls back to the first column.
    expect(rotation?.columnStart).toBe(1);
  });

  it("matches rotation references to full base names", () => {
    const layout = buildGroupGrid([
      { id: "red1", name: "Red Ants 1" },
      { id: "black1", name: "Black Ants 1" },
      { id: "blue1", name: "Blue Ants 1" },
      { id: "rotation", name: "Red Ants 1 <-> Black Ants 1" },
    ]);

    expect(cellFor(layout.cells, "rotation")).toMatchObject({
      columnStart: 1,
      columnSpan: 1,
      row: 2,
    });
  });

  it("falls back to the first column when a rotation cannot be matched", () => {
    const layout = buildGroupGrid([
      { id: "red1", name: "Red Ants 1" },
      { id: "black1", name: "Black Ants 1" },
      { id: "rotation", name: "Foo <-> Bar" },
    ]);

    expect(layout.columns).toBe(2);
    expect(cellFor(layout.cells, "rotation")).toMatchObject({
      columnStart: 1,
      columnSpan: 1,
      row: 2,
    });
  });

  it("stacks rotation groups that share the same column", () => {
    const layout = buildGroupGrid([
      { id: "red1", name: "Red Ants 1" },
      { id: "black1", name: "Black Ants 1" },
      { id: "blue1", name: "Blue Ants 1" },
      { id: "r1", name: "Red 1 <-> Black 1" },
      { id: "r2", name: "Red 2 <-> Black 2" },
    ]);

    expect(cellFor(layout.cells, "r1")).toMatchObject({
      columnStart: 1,
      row: 2,
    });
    expect(cellFor(layout.cells, "r2")).toMatchObject({
      columnStart: 1,
      row: 3,
    });
    expect(layout.rows).toBe(3);
  });

  it("does not stack groups that collide on the same slot", () => {
    const layout = buildGroupGrid([
      { id: "a", name: "Red Ants 1" },
      { id: "b", name: "Red Ants 1" },
    ]);

    expect(cellFor(layout.cells, "a")?.row).toBe(1);
    expect(cellFor(layout.cells, "b")?.row).toBe(2);
  });

  it("handles an empty list", () => {
    const layout = buildGroupGrid([]);
    expect(layout.columns).toBe(1);
    expect(layout.rows).toBe(1);
    expect(layout.cells).toHaveLength(1);
    expect(layout.cells[0]?.item).toBeNull();
  });
});
