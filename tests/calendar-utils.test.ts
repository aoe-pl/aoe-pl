import { describe, expect, it } from "vitest";
import {
  buildMonthGridDays,
  buildWeekDays,
  getMatchesForDay,
} from "../src/components/tournaments/calendar/calendar-utils";
import {
  CalendarMatchStatus,
  type CalendarMatch,
} from "../src/components/tournaments/calendar/types";

function makeMatch(date: Date, id = "m1"): CalendarMatch {
  return {
    id,
    groupId: "g1",
    date,
    player1Id: "p1",
    player2Id: "p2",
    status: CalendarMatchStatus.Scheduled,
  };
}

describe("buildMonthGridDays", () => {
  it("always returns a multiple of 7 days", () => {
    const months = [
      new Date(2024, 0, 1), // Jan 2024
      new Date(2024, 1, 1), // Feb 2024 (leap)
      new Date(2024, 11, 1), // Dec 2024
      new Date(2025, 0, 1), // Jan 2025
      new Date(2025, 1, 1), // Feb 2025 (non-leap)
      new Date(2025, 5, 1), // Jun 2025
    ];
    for (const m of months) {
      expect(buildMonthGridDays(m).length % 7).toBe(0);
    }
  });

  it("grid always starts on Monday", () => {
    const months = [
      new Date(2024, 0, 1),
      new Date(2024, 1, 1),
      new Date(2024, 11, 1),
      new Date(2025, 0, 1),
      new Date(2025, 1, 1),
    ];
    for (const m of months) {
      const days = buildMonthGridDays(m);
      expect(days[0]!.getDay()).toBe(1);
    }
  });

  it("Feb 2024 grid includes Feb 29 (leap year)", () => {
    const days = buildMonthGridDays(new Date(2024, 1, 1));
    expect(days.some((d) => d.getMonth() === 1 && d.getDate() === 29)).toBe(
      true,
    );
  });

  it("Feb 2025 grid does NOT include a 29th (non-leap year)", () => {
    const days = buildMonthGridDays(new Date(2025, 1, 1));
    expect(days.some((d) => d.getMonth() === 1 && d.getDate() === 29)).toBe(
      false,
    );
  });

  it("Jan 2025 grid includes trailing days from Dec 2024 (Mon Dec 30)", () => {
    const days = buildMonthGridDays(new Date(2025, 0, 1));
    const first = days[0]!;
    expect(first.getFullYear()).toBe(2024);
    expect(first.getMonth()).toBe(11); // December
    expect(first.getDate()).toBe(30);
  });

  it("Dec 2024 grid includes leading days from Jan 2025", () => {
    const days = buildMonthGridDays(new Date(2024, 11, 1));
    const last = days[days.length - 1]!;
    expect(last.getFullYear()).toBe(2025);
    expect(last.getMonth()).toBe(0); // January
    expect(last.getDate()).toBe(5);
  });

  it("all days in the main month are present", () => {
    const days = buildMonthGridDays(new Date(2024, 1, 1));
    const febDays = days.filter(
      (d) => d.getMonth() === 1 && d.getFullYear() === 2024,
    );
    expect(febDays).toHaveLength(29);
  });

  it("month starting on Monday has no leading days from previous month (Mar 2021)", () => {
    // Mar 1 2021 is a Monday — calStart should equal monthStart, no leading padding
    const days = buildMonthGridDays(new Date(2021, 2, 1));
    expect(days[0]!.getMonth()).toBe(2); // first day is still March
    expect(days[0]!.getDate()).toBe(1);
  });
});

describe("buildWeekDays", () => {
  it("always returns exactly 7 days", () => {
    expect(buildWeekDays(new Date(2025, 0, 9)).length).toBe(7);
    expect(buildWeekDays(new Date(2024, 1, 29)).length).toBe(7);
  });

  it("first day is always Monday", () => {
    const dates = [
      new Date(2025, 0, 9), // Thursday
      new Date(2024, 11, 31), // Tuesday
      new Date(2024, 1, 29), // Thursday (leap day)
    ];
    for (const d of dates) {
      expect(buildWeekDays(d)[0]!.getDay()).toBe(1);
    }
  });

  it("last day is always Sunday", () => {
    expect(buildWeekDays(new Date(2025, 0, 9))[6]!.getDay()).toBe(0);
  });

  it("handles the week spanning the year boundary (Dec 30 2024 - Jan 5 2025)", () => {
    const days = buildWeekDays(new Date(2024, 11, 31)); // Tue Dec 31
    const first = days[0]!;
    const last = days[6]!;

    expect(first.getFullYear()).toBe(2024);
    expect(first.getMonth()).toBe(11);
    expect(first.getDate()).toBe(30); // Mon Dec 30

    expect(last.getFullYear()).toBe(2025);
    expect(last.getMonth()).toBe(0);
    expect(last.getDate()).toBe(5); // Sun Jan 5
  });

  it("handles week that contains Feb 29 in a leap year", () => {
    const days = buildWeekDays(new Date(2024, 1, 29)); // Thu Feb 29 2024
    expect(days.some((d) => d.getMonth() === 1 && d.getDate() === 29)).toBe(
      true,
    );
  });

  it("passing a Monday returns the same week, not the previous one", () => {
    // Mon Jan 6 2025 — weekStartsOn:1, so start should stay on Jan 6
    const days = buildWeekDays(new Date(2025, 0, 6));
    expect(days[0]!.getDate()).toBe(6);
    expect(days[0]!.getMonth()).toBe(0);
    expect(days[6]!.getDate()).toBe(12); // Sun Jan 12
  });
});

describe("getMatchesForDay", () => {
  it("returns empty array when there are no matches", () => {
    expect(getMatchesForDay([], new Date(2025, 0, 9))).toEqual([]);
  });

  it("finds a match on Feb 29 in a leap year", () => {
    const match = makeMatch(new Date(2024, 1, 29, 18, 0));
    expect(getMatchesForDay([match], new Date(2024, 1, 29))).toHaveLength(1);
  });

  it("does not find a Feb 29 match when querying Feb 28", () => {
    const match = makeMatch(new Date(2024, 1, 29, 18, 0));
    expect(getMatchesForDay([match], new Date(2024, 1, 28))).toHaveLength(0);
  });

  it("places a match at 23:59 on Dec 31, not on Jan 1", () => {
    const match = makeMatch(new Date(2024, 11, 31, 23, 59));
    expect(getMatchesForDay([match], new Date(2024, 11, 31))).toHaveLength(1);
    expect(getMatchesForDay([match], new Date(2025, 0, 1))).toHaveLength(0);
  });

  it("places a match at 00:01 on Jan 1, not on Dec 31", () => {
    const match = makeMatch(new Date(2025, 0, 1, 0, 1));
    expect(getMatchesForDay([match], new Date(2025, 0, 1))).toHaveLength(1);
    expect(getMatchesForDay([match], new Date(2024, 11, 31))).toHaveLength(0);
  });

  it("sorts multiple matches ascending by time", () => {
    const m1 = makeMatch(new Date(2025, 0, 9, 20, 0), "m1");
    const m2 = makeMatch(new Date(2025, 0, 9, 14, 0), "m2");
    const m3 = makeMatch(new Date(2025, 0, 9, 17, 0), "m3");
    const result = getMatchesForDay([m1, m2, m3], new Date(2025, 0, 9));
    expect(result.map((m) => m.id)).toEqual(["m2", "m3", "m1"]);
  });

  it("only returns matches for the queried day, not adjacent days", () => {
    const yesterday = makeMatch(new Date(2025, 0, 8, 22, 0), "yesterday");
    const today = makeMatch(new Date(2025, 0, 9, 10, 0), "today");
    const tomorrow = makeMatch(new Date(2025, 0, 10, 8, 0), "tomorrow");
    const result = getMatchesForDay(
      [yesterday, today, tomorrow],
      new Date(2025, 0, 9),
    );
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("today");
  });

  it("handles tournament spanning year boundary (match on Jan 1 2025)", () => {
    const match = makeMatch(new Date(2025, 0, 1, 15, 0));
    expect(getMatchesForDay([match], new Date(2025, 0, 1))).toHaveLength(1);
    expect(getMatchesForDay([match], new Date(2024, 11, 31))).toHaveLength(0);
  });

  it("match at midnight (00:00) is found on the correct day", () => {
    const match = makeMatch(new Date(2025, 3, 15, 0, 0), "midnight");
    expect(getMatchesForDay([match], new Date(2025, 3, 15))).toHaveLength(1);
    expect(getMatchesForDay([match], new Date(2025, 3, 14))).toHaveLength(0);
  });

  it("returns all matches when multiple fall on the same day", () => {
    const m1 = makeMatch(new Date(2025, 3, 15, 10, 0), "a");
    const m2 = makeMatch(new Date(2025, 3, 15, 14, 0), "b");
    const m3 = makeMatch(new Date(2025, 3, 15, 18, 0), "c");
    expect(getMatchesForDay([m1, m2, m3], new Date(2025, 3, 15))).toHaveLength(
      3,
    );
  });

  it("preserves isStreamed and isVerified flags on returned matches", () => {
    const match: CalendarMatch = {
      ...makeMatch(new Date(2025, 3, 15, 20, 0)),
      isStreamed: true,
      isVerified: true,
    };
    const result = getMatchesForDay([match], new Date(2025, 3, 15));
    expect(result[0]!.isStreamed).toBe(true);
    expect(result[0]!.isVerified).toBe(true);
  });
});
