import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type LoanWithBorrower = {
  id: string;
  status: "ACTIVE" | "RETURNED";
  borrowedAt: Date;
  dueAt: Date;
  returnedAt: Date | null;
  user: {
    name: string | null;
    email: string;
  };
};

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

function StatusBadge({
  loan,
  isOverdue,
}: {
  loan: LoanWithBorrower;
  isOverdue: boolean;
}) {
  if (isOverdue) {
    return <Badge variant="destructive">Overdue</Badge>;
  }
  if (loan.status === "ACTIVE") {
    return <Badge variant="secondary">Active</Badge>;
  }
  return <Badge variant="outline">Returned</Badge>;
}

export function LoanHistoryTable({ loans }: { loans: LoanWithBorrower[] }) {
  const now = new Date();

  if (loans.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        This book has not been borrowed yet.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Borrower</TableHead>
          <TableHead>Borrowed</TableHead>
          <TableHead>Due</TableHead>
          <TableHead>Returned</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loans.map((loan) => {
          const isOverdue = loan.status === "ACTIVE" && loan.dueAt < now;
          return (
            <TableRow
              key={loan.id}
              className={isOverdue ? "bg-destructive/5" : undefined}
            >
              <TableCell>{loan.user.name ?? loan.user.email}</TableCell>
              <TableCell>{dateFormat.format(loan.borrowedAt)}</TableCell>
              <TableCell
                className={
                  isOverdue ? "font-medium text-destructive" : undefined
                }
              >
                {dateFormat.format(loan.dueAt)}
              </TableCell>
              <TableCell>
                {loan.returnedAt ? dateFormat.format(loan.returnedAt) : "–"}
              </TableCell>
              <TableCell>
                <StatusBadge loan={loan} isOverdue={isOverdue} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
