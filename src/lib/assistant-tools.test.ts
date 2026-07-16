import { beforeEach, describe, expect, it, vi } from "vitest";

// Captures the where clauses the tools send to Prisma and returns canned
// rows, so the scoping contract is testable without a database.
const mocks = vi.hoisted(() => {
  const state = {
    bookFindManyWhere: null as unknown,
    bookFindFirstWhere: null as unknown,
    loanFindManyWhere: null as unknown,
    bookRows: [] as unknown[],
    loanRows: [] as unknown[],
  };
  const prisma = {
    book: {
      findMany: async ({ where }: { where: unknown }) => {
        state.bookFindManyWhere = where;
        return state.bookRows;
      },
      findFirst: async ({ where }: { where: unknown }) => {
        state.bookFindFirstWhere = where;
        return state.bookRows[0] ?? null;
      },
    },
    loan: {
      findMany: async ({ where }: { where: unknown }) => {
        state.loanFindManyWhere = where;
        return state.loanRows;
      },
    },
  };
  return { state, prisma };
});

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));

import {
  getBookAvailability,
  getMyLoans,
  searchBooks,
} from "@/lib/assistant-tools";

function bookRow(title: string, totalCopies: number, activeLoans: number) {
  return {
    title,
    author: "Author",
    genre: "Fantasy",
    totalCopies,
    _count: { loans: activeLoans },
  };
}

beforeEach(() => {
  mocks.state.bookFindManyWhere = null;
  mocks.state.bookFindFirstWhere = null;
  mocks.state.loanFindManyWhere = null;
  mocks.state.bookRows = [];
  mocks.state.loanRows = [];
});

describe("searchBooks", () => {
  it("always excludes archived books", async () => {
    await searchBooks({ query: "dune" });

    expect(mocks.state.bookFindManyWhere).toMatchObject({ archivedAt: null });
  });

  it("returns at most five results with availability", async () => {
    mocks.state.bookRows = [
      bookRow("A", 2, 1),
      bookRow("B", 1, 1),
      bookRow("C", 1, 0),
      bookRow("D", 1, 0),
      bookRow("E", 1, 0),
      bookRow("F", 1, 0),
      bookRow("G", 1, 0),
    ];

    const { results } = await searchBooks({});

    expect(results).toHaveLength(5);
    expect(results[0]).toEqual({
      title: "A",
      author: "Author",
      genre: "Fantasy",
      availableCopies: 1,
      totalCopies: 2,
      available: true,
    });
  });

  it("filters to available books when asked", async () => {
    mocks.state.bookRows = [bookRow("A", 1, 1), bookRow("B", 1, 0)];

    const { results } = await searchBooks({ availableOnly: true });

    expect(results.map((book) => book.title)).toEqual(["B"]);
  });
});

describe("getBookAvailability", () => {
  it("excludes archived books and reports availability", async () => {
    mocks.state.bookRows = [bookRow("Dune", 2, 2)];

    const result = await getBookAvailability({ title: "dune" });

    expect(mocks.state.bookFindFirstWhere).toMatchObject({ archivedAt: null });
    expect(result).toMatchObject({ found: true, available: false });
  });

  it("reports when no title matches", async () => {
    expect(await getBookAvailability({ title: "nope" })).toEqual({
      found: false,
    });
  });
});

describe("getMyLoans", () => {
  it("is scoped to exactly the given user id", async () => {
    mocks.state.loanRows = [];

    await getMyLoans("user-42");

    expect(mocks.state.loanFindManyWhere).toEqual({ userId: "user-42" });
  });

  it("returns due dates and status", async () => {
    mocks.state.loanRows = [
      {
        book: { title: "Dune" },
        status: "ACTIVE",
        borrowedAt: new Date("2026-07-01T00:00:00Z"),
        dueAt: new Date("2026-07-15T00:00:00Z"),
        returnedAt: null,
      },
    ];

    const { loans } = await getMyLoans("user-1");

    expect(loans).toEqual([
      {
        book: "Dune",
        status: "ACTIVE",
        borrowedAt: "2026-07-01",
        dueAt: "2026-07-15",
        returnedAt: null,
      },
    ]);
  });
});
