/**
 * Layout helpers for the public tournament group selector.
 *
 * Groups are named with a "base name" plus an optional trailing number that
 * denotes the row (round) they belong to, e.g.:
 *
 *   Red Ants 1
 *   Red Ants 2
 *   Black Ants 1
 *   Blue Ants 1
 *   Blue Ants 2
 *
 * Groups sharing a base name ("Red Ants") form a column, so the example above
 * renders as:
 *
 *   Row 1: Red Ants 1 | Black Ants 1 | Blue Ants 1
 *   Row 2: Red Ants 2 |             | Blue Ants 2
 *
 * Columns are ordered by the order in which the items are provided, which is
 * the group's `displayOrder` from the database. Rows are ordered by the
 * trailing number (1 at the top, 2, 3, ... below).
 *
 * "Rotation" groups link two base groups, e.g. "Red 2 <-> Black 1" or
 * "Gold Ants 2 🔄 Red Ants 1". They belong to the column of the *first*
 * referenced group and are placed below the regular rows of that column. Their
 * tile is drawn with a horizontal gradient from the first group's color to the
 * second group's color so the rotation stays visible.
 */

/**
 * Separators that indicate a "rotation" group referencing two base groups.
 * Matched case-insensitively with surrounding whitespace. Includes the 🔄 / 🔁
 * emoji used in the existing group names as well as textual alternatives.
 */
const ROTATION_SEPARATOR =
  /\s*(?:<->|<=>|<-->|-->|<--|->|<-|↔|⇄|⇔|⇆|→|←|\u{1F504}\uFE0F?|\u{1F501}\uFE0F?|\bvs\.?\b)\s*/iu;

/** Emoji used to join the two groups of a rotation name. */
export const ROTATION_SYMBOL = "🔄";

export type ParsedGroupName = {
  /** Name without the trailing row number, e.g. "Red Ants". */
  base: string;
  /** Trailing row number (1-based), defaults to 1 when absent. */
  index: number;
  /** Whether the name references two base groups (rotation group). */
  rotation: boolean;
  /** The referenced groups of a rotation name, in the order written. */
  parts: { base: string; index: number }[];
};

/**
 * Splits a trailing 1-2 digit number from a name. Longer numbers (e.g. years
 * like "Season 2024") are kept as part of the base name to avoid exploding the
 * grid into hundreds of rows.
 */
function splitTrailingNumber(value: string): {
  base: string;
  index: number | null;
} {
  const match = /^(.*?)(\d+)\s*$/.exec(value);
  if (!match) return { base: value.trim(), index: null };

  const digits = match[2]!;
  const base = match[1]!.replace(/[\s\-–—#]+$/, "");
  const index = Number(digits);

  if (!base || index < 1 || digits.length > 2) {
    return { base: value.trim(), index: null };
  }

  return { base, index };
}

/** Parses a single group name into its base name, row index and rotation flag. */
export function parseGroupName(name: string): ParsedGroupName {
  const trimmed = name.trim();
  const rawParts = trimmed.split(ROTATION_SEPARATOR);

  if (rawParts.length > 1) {
    const parts = rawParts
      .map((part) => splitTrailingNumber(part.trim()))
      .filter((part) => part.base.length > 0)
      .map((part) => ({ base: part.base, index: part.index ?? 1 }));

    if (parts.length > 1) {
      return { base: trimmed, index: 1, rotation: true, parts };
    }
  }

  const { base, index } = splitTrailingNumber(trimmed);
  return { base, index: index ?? 1, rotation: false, parts: [] };
}

/** Minimal shape the grid layout works with. */
export type GroupGridInput = {
  id: string;
  name: string;
  /** The group's color, used for the tile background (and rotation gradient). */
  color?: string | null;
  /** Whether the group was explicitly flagged as a rotation group in the DB. */
  isRotational?: boolean;
};

export type GroupGridCell<T extends GroupGridInput> = {
  /** Stable key, unique per rendered cell (including empty placeholders). */
  key: string;
  /** The group for this cell, or `null` for an empty placeholder. */
  item: T | null;
  /** 1-based grid column the cell starts at. */
  columnStart: number;
  /** How many columns the cell spans. */
  columnSpan: number;
  /** 1-based grid row. */
  row: number;
  /** Whether the cell holds a rotation group. */
  rotation: boolean;
  /**
   * For rotation groups: the colors of the two referenced groups, in the order
   * written. Either entry can be `null` when the referenced group has no color.
   */
  rotationColors?: [string | null, string | null];
};

export type GroupGridLayout<T extends GroupGridInput> = {
  columns: number;
  rows: number;
  cells: GroupGridCell<T>[];
};

/** A parsed entry is a rotation when it is flagged in the DB or named as one. */
function isRotation(entry: {
  item: GroupGridInput;
  name: ParsedGroupName;
}): boolean {
  return entry.item.isRotational === true || entry.name.rotation;
}

/**
 * Finds the column index of a rotation reference. Prefers an exact match and
 * falls back to a prefix match so a shorter reference (e.g. "Red") still maps
 * to a longer base name (e.g. "Red Ants").
 */
function findColumn(base: string, columnBases: string[]): number {
  const normalized = base.toLowerCase();

  const exact = columnBases.findIndex(
    (column) => column.toLowerCase() === normalized,
  );
  if (exact >= 0) return exact;

  return columnBases.findIndex((column) => {
    const lower = column.toLowerCase();
    return lower.startsWith(normalized) || normalized.startsWith(lower);
  });
}

/**
 * Builds a grid layout for the given groups. The order of `items` determines
 * the column order, so callers should pass them sorted by `displayOrder`.
 */
export function buildGroupGrid<T extends GroupGridInput>(
  items: T[],
): GroupGridLayout<T> {
  const parsed = items.map((item) => ({
    item,
    name: parseGroupName(item.name),
  }));

  // Column order = order in which base names first appear, ignoring rotation
  // groups (they reference existing columns rather than defining new ones).
  const columnBases: string[] = [];
  for (const entry of parsed) {
    if (isRotation(entry)) continue;
    if (!columnBases.includes(entry.name.base)) {
      columnBases.push(entry.name.base);
    }
  }

  // Look up a referenced group's color by its base name + row number, falling
  // back to any group sharing the base name.
  const colorByBaseIndex = new Map<string, string | null>();
  const colorByBase = new Map<string, string | null>();
  for (const entry of parsed) {
    if (isRotation(entry)) continue;
    const color = entry.item.color ?? null;
    colorByBase.set(entry.name.base.toLowerCase(), color);
    colorByBaseIndex.set(
      `${entry.name.base.toLowerCase()}\u0000${entry.name.index}`,
      color,
    );
  }
  const lookupColor = (part: {
    base: string;
    index: number;
  }): string | null => {
    const base = part.base.toLowerCase();
    return (
      colorByBaseIndex.get(`${base}\u0000${part.index}`) ??
      colorByBase.get(base) ??
      null
    );
  };

  const columns = Math.max(columnBases.length, 1);
  const occupied = new Set<string>();
  const cells: GroupGridCell<T>[] = [];

  let maxRow = 1;

  // Place the regular groups: column from the base name, row from the number.
  for (const entry of parsed) {
    if (isRotation(entry)) continue;

    const column = Math.max(columnBases.indexOf(entry.name.base), 0) + 1;
    let row = entry.name.index;
    while (occupied.has(`${column}:${row}`)) row += 1;

    occupied.add(`${column}:${row}`);
    maxRow = Math.max(maxRow, row);

    cells.push({
      key: entry.item.id,
      item: entry.item,
      columnStart: column,
      columnSpan: 1,
      row,
      rotation: false,
    });
  }

  // Place rotation groups in the column of their first referenced group, below
  // the regular rows. Several rotations in the same column stack downwards.
  const rotations = parsed.filter((entry) => isRotation(entry));
  const rotationColumnRows = new Map<number, Set<number>>();
  let lastRow = maxRow;

  for (const entry of rotations) {
    const parts = entry.name.rotation ? entry.name.parts : [];

    // Column of the first reference that can be resolved (fallback: column 1).
    let column = -1;
    for (const part of parts) {
      const found = findColumn(part.base, columnBases);
      if (found >= 0) {
        column = found + 1;
        break;
      }
    }
    if (column < 0) column = 1;

    const usedRows = rotationColumnRows.get(column) ?? new Set<number>();
    let row = maxRow + 1;
    while (usedRows.has(row)) row += 1;
    usedRows.add(row);
    rotationColumnRows.set(column, usedRows);

    lastRow = Math.max(lastRow, row);

    const rotationColors: [string | null, string | null] | undefined =
      parts.length >= 2
        ? [lookupColor(parts[0]!), lookupColor(parts[1]!)]
        : undefined;

    cells.push({
      key: entry.item.id,
      item: entry.item,
      columnStart: column,
      columnSpan: 1,
      row,
      rotation: true,
      rotationColors,
    });
  }

  // Fill every remaining slot with an empty placeholder so the column
  // separators stay continuous and rows keep their alignment.
  const covered = new Set<string>();
  for (const cell of cells) {
    for (
      let column = cell.columnStart;
      column < cell.columnStart + cell.columnSpan;
      column += 1
    ) {
      covered.add(`${column}:${cell.row}`);
    }
  }

  for (let row = 1; row <= lastRow; row += 1) {
    for (let column = 1; column <= columns; column += 1) {
      if (covered.has(`${column}:${row}`)) continue;
      cells.push({
        key: `empty-${row}-${column}`,
        item: null,
        columnStart: column,
        columnSpan: 1,
        row,
        rotation: false,
      });
    }
  }

  cells.sort((a, b) => a.row - b.row || a.columnStart - b.columnStart);

  return { columns, rows: lastRow, cells };
}
