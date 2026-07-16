import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReturnLoanButton } from "@/components/loans/return-loan-button";
import { dateFormat } from "@/lib/format";
import { daysOverdue } from "@/lib/loan-utils";

type LoanRow = {
  id: string;
  status: "ACTIVE" | "RETURNED";
  borrowedAt: Date;
  dueAt: Date;
  book: {
    id: string;
    title: string;
  };
  user?: {
    name: string | null;
    email: string;
  };
};

function StatusBadge({ loan, now }: { loan: LoanRow; now: Date }) {
  if (loan.status === "RETURNED") {
    return <Badge variant="outline">Returned</Badge>;
  }
  const days = daysOverdue(loan.dueAt, now);
  if (days > 0) {
    return (
      <Badge variant="destructive">
        Overdue by {days} {days === 1 ? "day" : "days"}
      </Badge>
    );
  }
  return <Badge variant="secondary">Active</Badge>;
}

export function LoansTable({
  loans,
  showBorrower,
  now,
}: {
  loans: LoanRow[];
  showBorrower: boolean;
  now: Date;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Book</TableHead>
          {showBorrower && <TableHead>Borrower</TableHead>}
          <TableHead>Borrowed</TableHead>
          <TableHead>Due</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-0" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {loans.map((loan) => {
          const isOverdue =
            loan.status === "ACTIVE" && daysOverdue(loan.dueAt, now) > 0;
          return (
            <TableRow
              key={loan.id}
              className={isOverdue ? "bg-destructive/5" : undefined}
            >
              <TableCell>
                <Link
                  href={`/books/${loan.book.id}`}
                  className="font-medium hover:underline"
                >
                  {loan.book.title}
                </Link>
              </TableCell>
              {showBorrower && (
                <TableCell>{loan.user?.name ?? loan.user?.email}</TableCell>
              )}
              <TableCell>{dateFormat.format(loan.borrowedAt)}</TableCell>
              <TableCell
                className={
                  isOverdue ? "font-medium text-destructive" : undefined
                }
              >
                {dateFormat.format(loan.dueAt)}
              </TableCell>
              <TableCell>
                <StatusBadge loan={loan} now={now} />
              </TableCell>
              <TableCell>
                {loan.status === "ACTIVE" && (
                  <ReturnLoanButton loanId={loan.id} />
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
