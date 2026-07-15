import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookCover } from "@/components/books/book-cover";
import { BorrowReturnPanel } from "@/components/books/borrow-return-panel";
import { DeleteBookButton } from "@/components/books/delete-book-button";
import { LoanHistoryTable } from "@/components/books/loan-history-table";

// Dev-only until auth: the seeded demo users power the acting-as picker.
async function getDemoUsers() {
  return prisma.user.findMany({
    where: {
      email: { in: ["demo.member@example.com", "demo.librarian@example.com"] },
    },
    select: { id: true, name: true, email: true },
    orderBy: { email: "asc" },
  });
}

// cache() dedupes the query between generateMetadata and the page render.
const getBook = cache(async (id: string) => {
  return prisma.book.findUnique({
    where: { id },
    include: {
      loans: {
        orderBy: { borrowedAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const book = await getBook(id);
  return { title: book ? book.title : "Book not found" };
}

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [book, demoUsers] = await Promise.all([getBook(id), getDemoUsers()]);
  if (!book) {
    notFound();
  }

  const activeLoans = book.loans.filter((loan) => loan.status === "ACTIVE");
  const availableCopies = book.totalCopies - activeLoans.length;
  const isAvailable = availableCopies > 0;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <Link
        href="/books"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
        Back to books
      </Link>

      <div className="mt-6 flex flex-col gap-8 sm:flex-row">
        <div className="w-40 shrink-0 self-start overflow-hidden rounded-xl ring-1 ring-foreground/10 sm:w-48">
          <BookCover coverUrl={book.coverUrl} title={book.title} />
        </div>

        <div className="flex flex-1 flex-col gap-4">
          <div>
            <h1 className="font-heading text-3xl font-semibold">
              {book.title}
            </h1>
            <p className="text-lg text-muted-foreground">{book.author}</p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {book.genre && <Badge variant="outline">{book.genre}</Badge>}
            {isAvailable ? (
              <Badge className="bg-emerald-600/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-400">
                {availableCopies} of {book.totalCopies} copies available
              </Badge>
            ) : (
              <Badge variant="destructive">All copies out</Badge>
            )}
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
            {book.isbn && (
              <>
                <dt className="text-muted-foreground">ISBN</dt>
                <dd>{book.isbn}</dd>
              </>
            )}
            {book.publishedYear && (
              <>
                <dt className="text-muted-foreground">Published</dt>
                <dd>{book.publishedYear}</dd>
              </>
            )}
            <dt className="text-muted-foreground">Total copies</dt>
            <dd>{book.totalCopies}</dd>
          </dl>

          {book.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {book.description}
            </p>
          )}

          <BorrowReturnPanel
            bookId={book.id}
            availableCopies={availableCopies}
            activeLoans={activeLoans.map((loan) => ({
              id: loan.id,
              userId: loan.userId,
              dueAt: loan.dueAt,
            }))}
            users={demoUsers}
          />

          <div className="mt-auto flex flex-wrap gap-2 pt-2">
            <Button
              variant="outline"
              render={<Link href={`/books/${book.id}/edit`} />}
            >
              <PencilIcon /> Edit
            </Button>
            <DeleteBookButton bookId={book.id} bookTitle={book.title} />
          </div>
        </div>
      </div>

      <section className="mt-10 flex flex-col gap-3">
        <h2 className="font-heading text-lg font-medium">Loan history</h2>
        <LoanHistoryTable loans={book.loans} />
      </section>
    </main>
  );
}
