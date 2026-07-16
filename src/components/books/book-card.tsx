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

type BookCardProps = {
  book: {
    id: string;
    title: string;
    author: string;
    genre: string | null;
    coverUrl: string | null;
    totalCopies: number;
    availableCopies: number;
  };
};

export function BookCard({ book }: BookCardProps) {
  const isAvailable = book.availableCopies > 0;

  return (
    <Link
      href={`/books/${book.id}`}
      className="rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="h-full pt-0 transition-shadow hover:ring-foreground/25">
        <BookCover coverUrl={book.coverUrl} title={book.title} />
        <CardHeader>
          <CardTitle className="line-clamp-2">{book.title}</CardTitle>
          <CardDescription>{book.author}</CardDescription>
        </CardHeader>
        <CardContent className="mt-auto flex flex-wrap gap-1.5">
          {book.genre && <Badge variant="outline">{book.genre}</Badge>}
          {isAvailable ? (
            <Badge className="bg-success/15 text-success">
              {book.availableCopies} of {book.totalCopies} available
            </Badge>
          ) : (
            <Badge variant="destructive">All copies out</Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
