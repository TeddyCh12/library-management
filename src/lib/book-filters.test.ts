import { describe, expect, it } from "vitest";

import { buildBooksWhere, parseAvailability } from "./book-filters";

describe("parseAvailability", () => {
  it("accepts available and out for everyone", () => {
    expect(parseAvailability("available", false)).toBe("available");
    expect(parseAvailability("out", false)).toBe("out");
  });

  it("only allows archived for librarians", () => {
    expect(parseAvailability("archived", true)).toBe("archived");
    expect(parseAvailability("archived", false)).toBe("all");
  });

  it("falls back to all for unknown values", () => {
    expect(parseAvailability(undefined, true)).toBe("all");
    expect(parseAvailability("nonsense", true)).toBe("all");
  });
});

describe("buildBooksWhere", () => {
  it("excludes archived books by default", () => {
    expect(buildBooksWhere(undefined, undefined, "all")).toEqual({
      archivedAt: null,
    });
    expect(buildBooksWhere(undefined, undefined, "available")).toEqual({
      archivedAt: null,
    });
  });

  it("shows only archived books in the archived view", () => {
    expect(buildBooksWhere(undefined, undefined, "archived")).toEqual({
      archivedAt: { not: null },
    });
  });

  it("combines search and genre with the archive exclusion", () => {
    expect(buildBooksWhere("dune", "Sci-Fi", "all")).toEqual({
      archivedAt: null,
      OR: [
        { title: { contains: "dune", mode: "insensitive" } },
        { author: { contains: "dune", mode: "insensitive" } },
      ],
      genre: "Sci-Fi",
    });
  });
});
