"use server";

import { revalidatePath } from "next/cache";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type LoanActionResult = { ok: true } | { ok: false; error: string };

const LOAN_PERIOD_DAYS = 14;

// Domain failures inside the transaction are thrown as LoanError so they
// roll the transaction back, then are mapped to a typed error result.
class LoanError extends Error {}

function isWriteConflict(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  );
}

export async function borrowBook(
  bookId: string,
  userId: string,
): Promise<LoanActionResult> {
  // Auth comes later: userId will be read from the session instead of
  // being passed in by the caller.

  try {
    await prisma.$transaction(
      async (tx) => {
        const book = await tx.book.findUnique({ where: { id: bookId } });
        if (!book) {
          throw new LoanError("Book not found");
        }

        const activeLoans = await tx.loan.count({
          where: { bookId, status: "ACTIVE" },
        });
        if (activeLoans >= book.totalCopies) {
          throw new LoanError("No copies available");
        }

        const alreadyBorrowed = await tx.loan.count({
          where: { bookId, userId, status: "ACTIVE" },
        });
        if (alreadyBorrowed > 0) {
          throw new LoanError("You already have this book checked out");
        }

        const dueAt = new Date(
          Date.now() + LOAN_PERIOD_DAYS * 24 * 60 * 60 * 1000,
        );
        await tx.loan.create({
          data: { bookId, userId, status: "ACTIVE", dueAt },
        });
      },
      // Serializable so two concurrent borrows cannot both pass the
      // availability check and overdraw the copies.
      { isolationLevel: "Serializable" },
    );
  } catch (error) {
    if (error instanceof LoanError) {
      return { ok: false, error: error.message };
    }
    if (isWriteConflict(error)) {
      return { ok: false, error: "Someone else just borrowed this book — please try again" };
    }
    throw error;
  }

  revalidatePath("/books");
  revalidatePath(`/books/${bookId}`);
  return { ok: true };
}

export async function returnBook(
  loanId: string,
  userId: string,
): Promise<LoanActionResult> {
  // Auth comes later: userId will be read from the session instead of
  // being passed in by the caller. Librarians will then also be allowed
  // to return loans on behalf of members.

  let bookId: string;
  try {
    bookId = await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({ where: { id: loanId } });
      if (!loan) {
        throw new LoanError("Loan not found");
      }
      if (loan.status !== "ACTIVE") {
        throw new LoanError("This loan has already been returned");
      }
      if (loan.userId !== userId) {
        throw new LoanError("You can only return your own loans");
      }

      await tx.loan.update({
        where: { id: loanId },
        data: { status: "RETURNED", returnedAt: new Date() },
      });
      return loan.bookId;
    });
  } catch (error) {
    if (error instanceof LoanError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }

  revalidatePath("/books");
  revalidatePath(`/books/${bookId}`);
  return { ok: true };
}
