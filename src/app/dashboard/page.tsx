import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReturnLoanButton } from "@/components/loans/return-loan-button";
import { auth } from "@/lib/auth";
import { dateFormat } from "@/lib/format";
import { daysOverdue } from "@/lib/loan-utils";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Dashboard",
};

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin?callbackUrl=/dashboard");
  }
  if (session.user.role !== "LIBRARIAN") {
    redirect("/books");
  }

  const now = new Date();
  const [
    copiesAggregate,
    activeCount,
    overdueCount,
    activeBorrowers,
    overdueLoans,
    recentBooks,
  ] = await Promise.all([
    // Archived books are out of circulation, so they don't count.
    prisma.book.aggregate({
      _sum: { totalCopies: true },
      where: { archivedAt: null },
    }),
    prisma.loan.count({ where: { status: "ACTIVE" } }),
    prisma.loan.count({ where: { status: "ACTIVE", dueAt: { lt: now } } }),
    prisma.loan.findMany({
      where: { status: "ACTIVE" },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.loan.findMany({
      where: { status: "ACTIVE", dueAt: { lt: now } },
      orderBy: { dueAt: "asc" },
      include: {
        book: { select: { id: true, title: true } },
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.book.findMany({
      where: { archivedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, author: true, createdAt: true },
    }),
  ]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="flex flex-col gap-6">
        <h1 className="font-heading text-2xl font-semibold">Dashboard</h1>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Total books"
            value={copiesAggregate._sum.totalCopies ?? 0}
          />
          <StatCard label="Currently borrowed" value={activeCount} />
          <StatCard label="Overdue" value={overdueCount} />
          <StatCard label="Active borrowers" value={activeBorrowers.length} />
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-medium">Overdue loans</h2>
          {overdueLoans.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No overdue loans. Everything is on time.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book</TableHead>
                  <TableHead>Borrower</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Days overdue</TableHead>
                  <TableHead className="w-0" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueLoans.map((loan) => (
                  <TableRow key={loan.id} className="bg-destructive/5">
                    <TableCell>
                      <Link
                        href={`/books/${loan.book.id}`}
                        className="font-medium hover:underline"
                      >
                        {loan.book.title}
                      </Link>
                    </TableCell>
                    <TableCell>{loan.user.name ?? loan.user.email}</TableCell>
                    <TableCell className="font-medium text-destructive">
                      {dateFormat.format(loan.dueAt)}
                    </TableCell>
                    <TableCell>{daysOverdue(loan.dueAt, now)}</TableCell>
                    <TableCell>
                      <ReturnLoanButton loanId={loan.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-medium">
            Recently added books
          </h2>
          <ul className="flex flex-col gap-2">
            {recentBooks.map((book) => (
              <li key={book.id} className="flex items-baseline gap-2 text-sm">
                <Link
                  href={`/books/${book.id}`}
                  className="font-medium hover:underline"
                >
                  {book.title}
                </Link>
                <span className="text-muted-foreground">
                  {book.author} · added {dateFormat.format(book.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
