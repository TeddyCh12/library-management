"use client";

import { useActionState, useEffect, useState } from "react";
import { ArchiveIcon } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { archiveBook } from "@/lib/actions/books";

export function ArchiveBookButton({
  bookId,
  bookTitle,
}: {
  bookId: string;
  bookTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(archiveBook, null);

  useEffect(() => {
    if (state?.error) {
      toast.error(`Could not archive book: ${state.error}`);
      setOpen(false);
    }
  }, [state]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="outline" />}>
        <ArchiveIcon /> Archive
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive &ldquo;{bookTitle}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            The book is removed from the catalog and can no longer be
            borrowed. Its loan history is kept, and a librarian can restore it
            at any time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <form action={formAction} className="max-sm:w-full">
            <input type="hidden" name="bookId" value={bookId} />
            <AlertDialogAction type="submit" disabled={isPending}>
              {isPending ? "Archiving…" : "Archive book"}
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
