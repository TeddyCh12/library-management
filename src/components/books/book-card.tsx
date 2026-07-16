import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookCover } from "@/components/books/book-cover";
import { RestoreBookButton } from "@/components/books/restore-book-button";

type CardBook = {
  id: string;
  title: string;
  author: string;
  genre: string | null;
  coverUrl: string | null;
  totalCopies: number;
  availableCopies: number;
  archived: boolean;
};

function StatusBadge({ book }: { book: CardBook }) {
  if (book.archived) {
    return <Badge variant="secondary">Archived</Badge>;
  }
  if (book.availableCopies > 0) {
    return (
      <Badge className="bg-success/15 text-success">
        {book.availableCopies} of {book.totalCopies} available
      </Badge>
    );
  }
  return <Badge variant="destructive">All copies out</Badge>;
}

export function BookCard({
  book,
  canRestore,
}: {
  book: CardBook;
  canRestore: boolean;
}) {
  return (
    <Card className="h-full pt-0 transition-shadow hover:ring-foreground/25">
      <Link
        href={`/books/${book.id}`}
        className="flex flex-col gap-(--card-spacing) rounded-t-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <BookCover coverUrl={book.coverUrl} title={book.title} />
        <CardHeader>
          <CardTitle className="line-clamp-2">{book.title}</CardTitle>
          <CardDescription>{book.author}</CardDescription>
        </CardHeader>
      </Link>
      <CardContent className="mt-auto flex flex-wrap items-center gap-1.5">
        {book.genre && <Badge variant="outline">{book.genre}</Badge>}
        <StatusBadge book={book} />
        {book.archived && canRestore && <RestoreBookButton bookId={book.id} />}
      </CardContent>
    </Card>
  );
}
