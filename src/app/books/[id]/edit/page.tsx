import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { updateBook } from "@/lib/actions/books";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BookForm } from "@/components/books/book-form";

export const metadata: Metadata = {
  title: "Edit book",
};

export default async function EditBookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // UX only — the proxy requires auth and updateBook re-checks the role.
  const session = await auth();
  if (session?.user?.role !== "LIBRARIAN") {
    redirect("/books");
  }

  const { id } = await params;
  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) {
    notFound();
  }

  const updateAction = updateBook.bind(null, book.id);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="font-heading text-2xl font-semibold">
        Edit “{book.title}”
      </h1>
      <div className="mt-6">
        <BookForm
          action={updateAction}
          defaultValues={book}
          submitLabel="Save changes"
          cancelHref={`/books/${book.id}`}
        />
      </div>
    </main>
  );
}
