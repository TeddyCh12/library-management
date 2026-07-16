"use server";

import { revalidatePath } from "next/cache";

import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type LoanActionResult = { ok: true } | { ok: false; error: string };

const LOAN_PERIOD_DAYS = 14;

// Domain failures inside the transaction are thrown as LoanError so they
// roll the transaction back, then are mapped to a typed error result.
class LoanError extends Error {}

const transactionOptions = {
  maxWait: 10000,
  timeout: 15000,
  // Serializable so two concurrent borrows cannot both pass the
  // availability check and overdraw the copies.
  isolationLevel: "Serializable",
} as const;

function isWriteConflict(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  );
}

// P2028: the transaction could not be started or timed out.
function isTransactionTimeout(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2028"
  );
}

export async function borrowBook(bookId: string): Promise<LoanActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: "Not authorized" };
  }
  const userId = session.user.id;

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
      transactionOptions,
    );
  } catch (error) {
    if (error instanceof LoanError) {
      return { ok: false, error: error.message };
    }
    if (isWriteConflict(error)) {
      return { ok: false, error: "Someone else just borrowed this book — please try again" };
    }
    if (isTransactionTimeout(error)) {
      return { ok: false, error: "The system is busy — please try again." };
    }
    throw error;
  }

  revalidatePath("/books");
  revalidatePath(`/books/${bookId}`);
  return { ok: true };
}

export async function returnBook(loanId: string): Promise<LoanActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: "Not authorized" };
  }
  const { id: userId, role } = session.user;

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
      // Members may only return their own loans; librarians may return any.
      if (loan.userId !== userId && role !== "LIBRARIAN") {
        throw new LoanError("You can only return your own loans");
      }

      await tx.loan.update({
        where: { id: loanId },
        data: { status: "RETURNED", returnedAt: new Date() },
      });
      return loan.bookId;
    }, transactionOptions);
  } catch (error) {
    if (error instanceof LoanError) {
      return { ok: false, error: error.message };
    }
    if (isWriteConflict(error) || isTransactionTimeout(error)) {
      return { ok: false, error: "The system is busy — please try again." };
    }
    throw error;
  }

  revalidatePath("/books");
  revalidatePath(`/books/${bookId}`);
  return { ok: true };
}
