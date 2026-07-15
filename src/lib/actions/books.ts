"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type BookFormState = {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
} | null;

export type DeleteBookState = {
  error?: string;
} | null;

const currentYear = new Date().getFullYear();

const bookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  isbn: z.string().nullable(),
  genre: z.string().nullable(),
  publishedYear: z.coerce
    .number("Published year must be a number")
    .int("Published year must be a whole number")
    .min(0, "Published year must be 0 or later")
    .max(currentYear + 1, `Published year cannot be after ${currentYear + 1}`)
    .nullable(),
  description: z.string().nullable(),
  coverUrl: z.url("Cover URL must be a valid URL").nullable(),
  totalCopies: z.coerce
    .number("Total copies must be a number")
    .int("Total copies must be a whole number")
    .min(1, "There must be at least 1 copy"),
});

// Empty inputs arrive as "" — store them as null rather than empty strings.
function readField(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function parseBookForm(formData: FormData) {
  return bookSchema.safeParse({
    title: readField(formData, "title") ?? "",
    author: readField(formData, "author") ?? "",
    isbn: readField(formData, "isbn"),
    genre: readField(formData, "genre"),
    publishedYear: readField(formData, "publishedYear"),
    description: readField(formData, "description"),
    coverUrl: readField(formData, "coverUrl"),
    totalCopies: readField(formData, "totalCopies") ?? "",
  });
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function createBook(
  _prevState: BookFormState,
  formData: FormData,
): Promise<BookFormState> {
  // Auth check goes here in a later step (librarian role required).

  const parsed = parseBookForm(formData);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  let bookId: string;
  try {
    const book = await prisma.book.create({ data: parsed.data });
    bookId = book.id;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        fieldErrors: { isbn: ["A book with this ISBN already exists"] },
      };
    }
    throw error;
  }

  revalidatePath("/books");
  revalidatePath(`/books/${bookId}`);
  redirect(`/books/${bookId}`);
}

export async function updateBook(
  bookId: string,
  _prevState: BookFormState,
  formData: FormData,
): Promise<BookFormState> {
  // Auth check goes here in a later step (librarian role required).

  const parsed = parseBookForm(formData);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const activeLoans = await prisma.loan.count({
    where: { bookId, status: "ACTIVE" },
  });
  if (parsed.data.totalCopies < activeLoans) {
    const copies = activeLoans === 1 ? "copy is" : "copies are";
    return {
      fieldErrors: {
        totalCopies: [
          `Cannot set total copies below ${activeLoans} — ${activeLoans} ${copies} currently checked out`,
        ],
      },
    };
  }

  try {
    await prisma.book.update({ where: { id: bookId }, data: parsed.data });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        fieldErrors: { isbn: ["A book with this ISBN already exists"] },
      };
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return { formError: "This book no longer exists" };
    }
    throw error;
  }

  revalidatePath("/books");
  revalidatePath(`/books/${bookId}`);
  redirect(`/books/${bookId}`);
}

export async function deleteBook(
  _prevState: DeleteBookState,
  formData: FormData,
): Promise<DeleteBookState> {
  // Auth check goes here in a later step (librarian role required).

  const bookId = readField(formData, "bookId");
  if (!bookId) {
    return { error: "Missing book id" };
  }

  const activeLoans = await prisma.loan.count({
    where: { bookId, status: "ACTIVE" },
  });
  if (activeLoans > 0) {
    const copies = activeLoans === 1 ? "copy is" : "copies are";
    return { error: `${activeLoans} ${copies} still checked out` };
  }

  try {
    // Returned-loan history belongs to the book, so it is deleted with it.
    await prisma.$transaction([
      prisma.loan.deleteMany({ where: { bookId } }),
      prisma.book.delete({ where: { id: bookId } }),
    ]);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return { error: "This book no longer exists" };
    }
    throw error;
  }

  revalidatePath("/books");
  redirect("/books");
}
