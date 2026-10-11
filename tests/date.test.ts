import { describe, expect, it } from "vitest";
import {
  formatDateOnly,
  formatDateOnlyLocale,
  toLocalCalendarDate,
  toUtcMidnight,
} from "../src/lib/date";

describe("toUtcMidnight", () => {
  it("maps a local date to UTC midnight of the same calendar day", () => {
    // 10 Nov 2026 00:00 in whatever the local timezone is.
    const local = new Date(2026, 10, 10, 0, 0, 0);
    const utc = toUtcMidnight(local);

    expect(utc.getUTCFullYear()).toBe(2026);
    expect(utc.getUTCMonth()).toBe(10);
    expect(utc.getUTCDate()).toBe(10);
    expect(utc.getUTCHours()).toBe(0);
    expect(utc.getUTCMinutes()).toBe(0);
  });

  it("ignores the time of day", () => {
    const local = new Date(2026, 10, 10, 23, 30, 0);

    expect(toUtcMidnight(local).toISOString()).toBe(
      new Date(Date.UTC(2026, 10, 10)).toISOString(),
    );
  });
});

describe("toLocalCalendarDate", () => {
  it("produces a local date with the same year/month/day as the UTC value", () => {
    const utcMidnight = new Date(Date.UTC(2026, 10, 10));
    const local = toLocalCalendarDate(utcMidnight);

    expect(local.getFullYear()).toBe(2026);
    expect(local.getMonth()).toBe(10);
    expect(local.getDate()).toBe(10);
    expect(local.getHours()).toBe(0);
  });
});

describe("formatDateOnly", () => {
  it("renders the UTC calendar day regardless of the machine timezone", () => {
    const utcMidnight = new Date(Date.UTC(2026, 10, 10));

    expect(formatDateOnly(utcMidnight, "yyyy-MM-dd")).toBe("2026-11-10");
  });

  it("round-trips a picked local date", () => {
    const picked = new Date(2026, 10, 10, 0, 0, 0);

    expect(formatDateOnly(toUtcMidnight(picked), "yyyy-MM-dd")).toBe(
      "2026-11-10",
    );
  });
});

describe("formatDateOnlyLocale", () => {
  it("formats using UTC so the day never shifts", () => {
    const utcMidnight = new Date(Date.UTC(2026, 10, 10));

    expect(formatDateOnlyLocale(utcMidnight, "en-GB")).toBe("10/11/2026");
  });
});
