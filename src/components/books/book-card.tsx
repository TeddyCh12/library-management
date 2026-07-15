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
    <Card className="pt-0">
      <BookCover coverUrl={book.coverUrl} title={book.title} />
      <CardHeader>
        <CardTitle className="line-clamp-2">{book.title}</CardTitle>
        <CardDescription>{book.author}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto flex flex-wrap gap-1.5">
        {book.genre && <Badge variant="outline">{book.genre}</Badge>}
        {isAvailable ? (
          <Badge className="bg-emerald-600/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-400">
            {book.availableCopies} of {book.totalCopies} available
          </Badge>
        ) : (
          <Badge variant="destructive">All copies out</Badge>
        )}
      </CardContent>
    </Card>
  );
}
