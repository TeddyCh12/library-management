"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { returnBook } from "@/lib/actions/loans";

export function ReturnLoanButton({ loanId }: { loanId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleReturn() {
    startTransition(async () => {
      const result = await returnBook(loanId);
      if (result.ok) {
        toast.success("Book returned");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleReturn}
      disabled={isPending}
    >
      {isPending ? "Returning…" : "Return"}
    </Button>
  );
}
