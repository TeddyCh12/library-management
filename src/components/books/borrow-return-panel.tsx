"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { borrowBook, returnBook } from "@/lib/actions/loans";

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

export function BorrowReturnPanel({
  bookId,
  availableCopies,
  userLoan,
  isSignedIn,
}: {
  bookId: string;
  availableCopies: number;
  // The signed-in user's own active loan on this book, if any.
  userLoan: { id: string; dueAt: Date } | null;
  isSignedIn: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleBorrow() {
    startTransition(async () => {
      const result = await borrowBook(bookId);
      if (result.ok) {
        toast.success("Book borrowed");
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleReturn() {
    if (!userLoan) {
      return;
    }
    const loanId = userLoan.id;
    startTransition(async () => {
      const result = await returnBook(loanId);
      if (result.ok) {
        toast.success("Book returned");
      } else {
        toast.error(result.error);
      }
    });
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-xl border p-4">
        <p className="text-sm text-muted-foreground">
          Sign in to borrow this book.
        </p>
        <Button
          size="sm"
          variant="outline"
          nativeButton={false}
          render={<Link href="/signin" />}
        >
          Sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-4">
      {userLoan ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm">
            Checked out — due{" "}
            <span className="font-medium">
              {dateFormat.format(userLoan.dueAt)}
            </span>
          </p>
          <Button variant="outline" onClick={handleReturn} disabled={isPending}>
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
    </div>
  );
}
