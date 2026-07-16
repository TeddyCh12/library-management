"use client";

import { useTransition } from "react";
import { ArchiveRestoreIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { restoreBook } from "@/lib/actions/books";

export function RestoreBookButton({
  bookId,
  size = "sm",
}: {
  bookId: string;
  size?: "sm" | "default";
}) {
  const [isPending, startTransition] = useTransition();

  function handleRestore() {
    startTransition(async () => {
      const result = await restoreBook(bookId);
      if (result.ok) {
        toast.success("Book restored to the catalog");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button
      size={size}
      variant="outline"
      onClick={handleRestore}
      disabled={isPending}
    >
      <ArchiveRestoreIcon />
      {isPending ? "Restoring…" : "Restore"}
    </Button>
  );
}
