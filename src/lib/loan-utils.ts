import type { Prisma } from "@/generated/prisma/client";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Whole days a loan is past due. Any overdue loan counts as at least 1 day
// so the UI never reads "overdue by 0 days"; loans due in the future are 0.
export function daysOverdue(dueAt: Date, now: Date): number {
  const msLate = now.getTime() - dueAt.getTime();
  if (msLate <= 0) {
    return 0;
  }
  return Math.max(1, Math.floor(msLate / MS_PER_DAY));
}

export type LoanFilter = "all" | "active" | "overdue" | "returned";

export function parseLoanFilter(value: string | undefined): LoanFilter {
  if (value === "active" || value === "overdue" || value === "returned") {
    return value;
  }
  return "all";
}

export function loanFilterWhere(
  filter: LoanFilter,
  now: Date,
): Prisma.LoanWhereInput {
  switch (filter) {
    case "active":
      return { status: "ACTIVE" };
    case "overdue":
      return { status: "ACTIVE", dueAt: { lt: now } };
    case "returned":
      return { status: "RETURNED" };
    case "all":
      return {};
  }
}
