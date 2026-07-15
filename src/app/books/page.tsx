import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon, SearchXIcon } from "lucide-react";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { BookCard } from "@/components/books/book-card";
import { BookFilters } from "@/components/books/book-filters";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Books",
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const q = first(params.q)?.trim();
  const genre = first(params.genre);
  const availability = first(params.availability);

  const where: Prisma.BookWhereInput = {};
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { author: { contains: q, mode: "insensitive" } },
    ];
  }
  if (genre) {
    where.genre = genre;
  }

  const [rows, genreRows] = await Promise.all([
    prisma.book.findMany({
      where,
      orderBy: { title: "asc" },
      include: {
        _count: {
          select: { loans: { where: { status: "ACTIVE" } } },
        },
      },
    }),
    prisma.book.findMany({
      where: { genre: { not: null } },
      select: { genre: true },
      distinct: ["genre"],
      orderBy: { genre: "asc" },
    }),
  ]);

  let books = rows.map((book) => ({
    ...book,
    availableCopies: book.totalCopies - book._count.loans,
  }));
  if (availability === "available") {
    books = books.filter((book) => book.availableCopies > 0);
  } else if (availability === "out") {
    books = books.filter((book) => book.availableCopies <= 0);
  }

  const genres = genreRows
    .map((row) => row.genre)
    .filter((value) => value !== null);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold">Books</h1>
            <p className="text-sm text-muted-foreground">
              {books.length} {books.length === 1 ? "book" : "books"}
            </p>
          </div>
          <Button render={<Link href="/books/new" />}>
            <PlusIcon /> Add book
          </Button>
        </div>
        <BookFilters genres={genres} />
        {books.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-24 text-muted-foreground">
            <SearchXIcon className="size-8" aria-hidden />
            <p>No books match your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
