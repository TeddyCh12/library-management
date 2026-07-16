import { prisma } from "@/lib/prisma";

// The assistant's read-only data access. Every function returns plain JSON
// for the model. Nothing here writes, and nothing returns another user's
// data: loans are always scoped to the session user id passed in by the
// route handler.

const MAX_RESULTS = 5;

type BookWithActiveCount = {
  title: string;
  author: string;
  genre: string | null;
  totalCopies: number;
  _count: { loans: number };
};

function toBookSummary(book: BookWithActiveCount) {
  const availableCopies = book.totalCopies - book._count.loans;
  return {
    title: book.title,
    author: book.author,
    genre: book.genre,
    availableCopies,
    totalCopies: book.totalCopies,
    available: availableCopies > 0,
  };
}

export async function searchBooks(args: {
  query?: string;
  genre?: string;
  availableOnly?: boolean;
}) {
  const books = await prisma.book.findMany({
    where: {
      archivedAt: null,
      ...(args.query
        ? {
            OR: [
              { title: { contains: args.query, mode: "insensitive" } },
              { author: { contains: args.query, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(args.genre
        ? { genre: { contains: args.genre, mode: "insensitive" } }
        : {}),
    },
    orderBy: { title: "asc" },
    take: 20,
    include: {
      _count: { select: { loans: { where: { status: "ACTIVE" } } } },
    },
  });

  let results = books.map(toBookSummary);
  if (args.availableOnly) {
    results = results.filter((book) => book.available);
  }
  return { results: results.slice(0, MAX_RESULTS) };
}

export async function getBookAvailability(args: { title: string }) {
  const book = await prisma.book.findFirst({
    where: {
      archivedAt: null,
      title: { contains: args.title, mode: "insensitive" },
    },
    orderBy: { title: "asc" },
    include: {
      _count: { select: { loans: { where: { status: "ACTIVE" } } } },
    },
  });
  if (!book) {
    return { found: false as const };
  }
  return { found: true as const, ...toBookSummary(book) };
}

export async function getMyLoans(userId: string) {
  const loans = await prisma.loan.findMany({
    where: { userId },
    orderBy: { borrowedAt: "desc" },
    take: 20,
    include: { book: { select: { title: true } } },
  });
  return {
    loans: loans.map((loan) => ({
      book: loan.book.title,
      status: loan.status,
      borrowedAt: loan.borrowedAt.toISOString().slice(0, 10),
      dueAt: loan.dueAt.toISOString().slice(0, 10),
      returnedAt: loan.returnedAt?.toISOString().slice(0, 10) ?? null,
    })),
  };
}
