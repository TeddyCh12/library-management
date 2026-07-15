"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { borrowBook, returnBook } from "@/lib/actions/loans";

type PanelUser = {
  id: string;
  name: string | null;
  email: string;
};

type ActiveLoan = {
  id: string;
  userId: string;
  dueAt: Date;
};

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

export function BorrowReturnPanel({
  bookId,
  availableCopies,
  activeLoans,
  users,
}: {
  bookId: string;
  availableCopies: number;
  activeLoans: ActiveLoan[];
  users: PanelUser[];
}) {
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();

  if (users.length === 0) {
    return null;
  }

  const activeLoan = activeLoans.find(
    (loan) => loan.userId === selectedUserId,
  );
  const userItems = users.map((user) => ({
    label: user.name ?? user.email,
    value: user.id,
  }));

  function handleBorrow() {
    startTransition(async () => {
      const result = await borrowBook(bookId, selectedUserId);
      if (result.ok) {
        toast.success("Book borrowed");
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleReturn() {
    if (!activeLoan) {
      return;
    }
    const loanId = activeLoan.id;
    startTransition(async () => {
      const result = await returnBook(loanId, selectedUserId);
      if (result.ok) {
        toast.success("Book returned");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border p-4">
      {/* Dev-only user picker: replaced by the session user once auth lands. */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Acting as</span>
        <Select
          items={userItems}
          value={selectedUserId}
          onValueChange={(value) => {
            if (value) {
              setSelectedUserId(value);
            }
          }}
        >
          <SelectTrigger size="sm" aria-label="Acting as user">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {userItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {activeLoan ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm">
            Checked out — due{" "}
            <span className="font-medium">
              {dateFormat.format(activeLoan.dueAt)}
            </span>
          </p>
          <Button
            variant="outline"
            onClick={handleReturn}
            disabled={isPending}
          >
            {isPending ? "Returning…" : "Return"}
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleBorrow}
            disabled={isPending || availableCopies <= 0}
          >
            {isPending ? "Borrowing…" : "Borrow this book"}
          </Button>
          {availableCopies <= 0 && (
            <p className="text-sm text-muted-foreground">
              All copies are checked out
            </p>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        The user picker is temporary until sign-in is added.
      </p>
    </div>
  );
}
