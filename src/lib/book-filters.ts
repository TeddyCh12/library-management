import type { Prisma } from "@/generated/prisma/client";

export type AvailabilityFilter = "all" | "available" | "out" | "archived";

// "archived" is a librarian-only view; for everyone else it falls back to
// the default catalog.
export function parseAvailability(
  value: string | undefined,
  allowArchived: boolean,
): AvailabilityFilter {
  if (value === "available" || value === "out") {
    return value;
  }
  if (value === "archived" && allowArchived) {
    return "archived";
  }
  return "all";
}

// The catalog where-clause. Archived books are excluded everywhere except
// the explicit archived view. The available/out filters are applied after
// the query, on the computed availableCopies.
export function buildBooksWhere(
  q: string | undefined,
  genre: string | undefined,
  availability: AvailabilityFilter,
): Prisma.BookWhereInput {
  const where: Prisma.BookWhereInput =
    availability === "archived"
      ? { archivedAt: { not: null } }
      : { archivedAt: null };

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { author: { contains: q, mode: "insensitive" } },
    ];
  }
  if (genre) {
    where.genre = genre;
  }
  return where;
}
