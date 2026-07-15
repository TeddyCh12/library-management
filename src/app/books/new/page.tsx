import type { Metadata } from "next";

import { createBook } from "@/lib/actions/books";
import { BookForm } from "@/components/books/book-form";

export const metadata: Metadata = {
  title: "Add book",
};

export default function NewBookPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="font-heading text-2xl font-semibold">Add a book</h1>
      <div className="mt-6">
        <BookForm
          action={createBook}
          submitLabel="Add book"
          cancelHref="/books"
        />
      </div>
    </main>
  );
}
