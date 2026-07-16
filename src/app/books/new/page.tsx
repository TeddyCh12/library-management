import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createBook } from "@/lib/actions/books";
import { auth } from "@/lib/auth";
import { BookForm } from "@/components/books/book-form";

export const metadata: Metadata = {
  title: "Add book",
};

export default async function NewBookPage() {
  // UX only — the proxy requires auth and createBook re-checks the role.
  const session = await auth();
  if (session?.user?.role !== "LIBRARIAN") {
    redirect("/books");
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="font-heading text-2xl font-semibold">Add a book</h1>
      <div className="mt-6">
        <BookForm
          action={createBook}
          submitLabel="Add book"
          cancelHref="/books"
          showAutofill={session.user.role === "LIBRARIAN"}
        />
      </div>
    </main>
  );
}
