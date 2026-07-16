import { describe, expect, it } from "vitest";

import { daysOverdue, loanFilterWhere, parseLoanFilter } from "./loan-utils";

const HOUR_MS = 60 * 60 * 1000;
const now = new Date("2026-07-16T12:00:00Z");

function hoursAgo(hours: number) {
  return new Date(now.getTime() - hours * HOUR_MS);
}

describe("daysOverdue", () => {
  it("is 0 for a loan due in the future", () => {
    expect(daysOverdue(hoursAgo(-48), now)).toBe(0);
  });

  it("is 0 for a loan due exactly now", () => {
    expect(daysOverdue(now, now)).toBe(0);
  });

  it("counts a loan a few hours late as 1 day", () => {
    expect(daysOverdue(hoursAgo(2), now)).toBe(1);
  });

  it("is 1 day at exactly 24 hours late", () => {
    expect(daysOverdue(hoursAgo(24), now)).toBe(1);
  });

  it("stays 1 day until the second full day has passed", () => {
    expect(daysOverdue(hoursAgo(47), now)).toBe(1);
    expect(daysOverdue(hoursAgo(48), now)).toBe(2);
  });

  it("counts whole days for long-overdue loans", () => {
    expect(daysOverdue(hoursAgo(14 * 24), now)).toBe(14);
    expect(daysOverdue(hoursAgo(14 * 24 + 12), now)).toBe(14);
  });
});

describe("parseLoanFilter", () => {
  it("accepts the known filter values", () => {
    expect(parseLoanFilter("active")).toBe("active");
    expect(parseLoanFilter("overdue")).toBe("overdue");
    expect(parseLoanFilter("returned")).toBe("returned");
  });

  it("falls back to all for missing or unknown values", () => {
    expect(parseLoanFilter(undefined)).toBe("all");
    expect(parseLoanFilter("")).toBe("all");
    expect(parseLoanFilter("nonsense")).toBe("all");
  });
});

describe("loanFilterWhere", () => {
  it("matches everything for all", () => {
    expect(loanFilterWhere("all", now)).toEqual({});
  });

  it("filters active loans", () => {
    expect(loanFilterWhere("active", now)).toEqual({ status: "ACTIVE" });
  });

  it("filters overdue loans as active and past due", () => {
    expect(loanFilterWhere("overdue", now)).toEqual({
      status: "ACTIVE",
      dueAt: { lt: now },
    });
  });

  it("filters returned loans", () => {
    expect(loanFilterWhere("returned", now)).toEqual({ status: "RETURNED" });
  });
});
