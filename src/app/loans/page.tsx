import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpenIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LoansTable } from "@/components/loans/loans-table";
import { auth } from "@/lib/auth";
import {
  loanFilterWhere,
  parseLoanFilter,
  type LoanFilter,
} from "@/lib/loan-utils";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Loans",
};

const filterOptions: Array<{ label: string; value: LoanFilter }> = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Overdue", value: "overdue" },
  { label: "Returned", value: "returned" },
];

function FilterToggle({ current }: { current: LoanFilter }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border p-1">
      {filterOptions.map((option) => (
        <Link
          key={option.value}
          href={
            option.value === "all" ? "/loans" : `/loans?filter=${option.value}`
          }
          className={
            option.value === current
              ? "rounded-md bg-muted px-3 py-1 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              : "rounded-md px-3 py-1 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          }
        >
          {option.label}
        </Link>
      ))}
    </div>
  );
}

export default async function LoansPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin?callbackUrl=/loans");
  }
  const { user } = session;
  const isLibrarian = user.role === "LIBRARIAN";

  const params = await searchParams;
  const rawFilter = Array.isArray(params.filter)
    ? params.filter[0]
    : params.filter;
  const filter = parseLoanFilter(rawFilter);

  const now = new Date();
  // Members always see exactly their own loans; the filter toggle is a
  // librarian tool over all loans.
  const where = isLibrarian
    ? loanFilterWhere(filter, now)
    : { userId: user.id };

  const loans = await prisma.loan.findMany({
    where,
    orderBy: { borrowedAt: "desc" },
    include: {
      book: { select: { id: true, title: true } },
      user: { select: { name: true, email: true } },
    },
  });

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold">
              {isLibrarian ? "All loans" : "My loans"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {loans.length} {loans.length === 1 ? "loan" : "loans"}
            </p>
          </div>
          {isLibrarian && <FilterToggle current={filter} />}
        </div>

        {loans.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
            <BookOpenIcon className="size-8" aria-hidden />
            <p>
              {isLibrarian && filter !== "all"
                ? "No loans match this filter"
                : "No loans yet — browse the catalog"}
            </p>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/books" />}
            >
              Browse books
            </Button>
          </div>
        ) : (
          <LoansTable loans={loans} showBorrower={isLibrarian} now={now} />
        )}
      </div>
    </main>
  );
}
