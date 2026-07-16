import { describe, expect, it } from "vitest";

import { parseBookMetadata } from "./book-metadata";

const CURRENT_YEAR = 2026;

describe("parseBookMetadata", () => {
  it("accepts a valid payload", () => {
    const raw = JSON.stringify({
      author: "Roald Dahl",
      genre: "Children's Fiction",
      publishedYear: 1988,
      description: "A gifted girl with telekinetic powers.",
    });

    expect(parseBookMetadata(raw, CURRENT_YEAR)).toEqual({
      author: "Roald Dahl",
      genre: "Children's Fiction",
      publishedYear: 1988,
      description: "A gifted girl with telekinetic powers.",
    });
  });

  it("strips markdown code fences", () => {
    const raw =
      '```json\n{"author":"Roald Dahl","genre":null,"publishedYear":1988,"description":null}\n```';

    expect(parseBookMetadata(raw, CURRENT_YEAR)).toEqual({
      author: "Roald Dahl",
      genre: null,
      publishedYear: 1988,
      description: null,
    });
  });

  it("returns null for non-JSON output", () => {
    expect(
      parseBookMetadata("Sorry, I don't recognize that book.", CURRENT_YEAR),
    ).toBeNull();
  });

  it("returns null for JSON with wrong field types", () => {
    const raw = JSON.stringify({ author: 42, publishedYear: "1988" });

    expect(parseBookMetadata(raw, CURRENT_YEAR)).toBeNull();
  });

  it("nulls an out-of-range published year but keeps other fields", () => {
    const future = JSON.stringify({ author: "Someone", publishedYear: 2999 });
    expect(parseBookMetadata(future, CURRENT_YEAR)).toEqual({
      author: "Someone",
      genre: null,
      publishedYear: null,
      description: null,
    });

    const ancient = JSON.stringify({ author: "Someone", publishedYear: 999 });
    expect(parseBookMetadata(ancient, CURRENT_YEAR)?.publishedYear).toBeNull();
  });

  it("treats missing and empty fields as null", () => {
    expect(parseBookMetadata("{}", CURRENT_YEAR)).toEqual({
      author: null,
      genre: null,
      publishedYear: null,
      description: null,
    });
    expect(
      parseBookMetadata(JSON.stringify({ author: "  " }), CURRENT_YEAR)
        ?.author,
    ).toBeNull();
  });

  it("truncates overlong strings", () => {
    const raw = JSON.stringify({
      author: "A".repeat(500),
      description: "B".repeat(2000),
    });

    const result = parseBookMetadata(raw, CURRENT_YEAR);
    expect(result?.author).toHaveLength(200);
    expect(result?.description).toHaveLength(600);
  });
});
