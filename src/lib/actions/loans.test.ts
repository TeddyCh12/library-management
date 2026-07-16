import { beforeEach, describe, expect, it, vi } from "vitest";

// In-memory stand-ins for the tables the loan actions touch, so the
// transaction logic can be tested without a database connection.
const mocks = vi.hoisted(() => {
  type BookRow = { id: string; totalCopies: number };
  type LoanRow = {
    id: string;
    bookId: string;
    userId: string;
    status: "ACTIVE" | "RETURNED";
    dueAt: Date;
    returnedAt: Date | null;
  };
  type SessionUser = { id: string; role: "MEMBER" | "LIBRARIAN" };

  const state = {
    books: [] as BookRow[],
    loans: [] as LoanRow[],
    session: null as { user: SessionUser } | null,
    transactionError: null as Error | null,
    lastTransactionOptions: undefined as unknown,
  };

  function matchesWhere(loan: LoanRow, where: Partial<LoanRow>) {
    return Object.entries(where).every(
      ([key, value]) => loan[key as keyof LoanRow] === value,
    );
  }

  const tx = {
    book: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        state.books.find((book) => book.id === where.id) ?? null,
    },
    loan: {
      count: async ({ where }: { where: Partial<LoanRow> }) =>
        state.loans.filter((loan) => matchesWhere(loan, where)).length,
      create: async ({ data }: { data: Omit<LoanRow, "id" | "returnedAt"> }) => {
        const loan: LoanRow = {
          id: `loan-${state.loans.length + 1}`,
          returnedAt: null,
          ...data,
        };
        state.loans.push(loan);
        return loan;
      },
      findUnique: async ({ where }: { where: { id: string } }) =>
        state.loans.find((loan) => loan.id === where.id) ?? null,
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<LoanRow>;
      }) => {
        const loan = state.loans.find((row) => row.id === where.id);
        if (!loan) {
          throw new Error("Record not found");
        }
        Object.assign(loan, data);
        return loan;
      },
    },
  };

  const prisma = {
    $transaction: async (
      fn: (tx: unknown) => Promise<unknown>,
      options?: unknown,
    ) => {
      state.lastTransactionOptions = options;
      if (state.transactionError) {
        throw state.transactionError;
      }
      return fn(tx);
    },
  };

  return { state, prisma, revalidatePath: vi.fn() };
});

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/auth", () => ({ auth: async () => mocks.state.session }));

import { Prisma } from "@/generated/prisma/client";
import { createBook } from "@/lib/actions/books";
import { borrowBook, returnBook } from "@/lib/actions/loans";

const DAY_MS = 24 * 60 * 60 * 1000;

function addBook(id: string, totalCopies: number) {
  mocks.state.books.push({ id, totalCopies });
}

function addActiveLoan(id: string, bookId: string, userId: string) {
  mocks.state.loans.push({
    id,
    bookId,
    userId,
    status: "ACTIVE",
    dueAt: new Date(Date.now() + 7 * DAY_MS),
    returnedAt: null,
  });
}

function signInAs(id: string, role: "MEMBER" | "LIBRARIAN") {
  mocks.state.session = { user: { id, role } };
}

beforeEach(() => {
  mocks.state.books.length = 0;
  mocks.state.loans.length = 0;
  mocks.state.session = null;
  mocks.state.transactionError = null;
  mocks.state.lastTransactionOptions = undefined;
  mocks.revalidatePath.mockClear();
});

const expectedTransactionOptions = {
  maxWait: 10000,
  timeout: 15000,
  isolationLevel: "Serializable",
};

describe("borrowBook", () => {
  it("creates an active loan due in 14 days for the session user", async () => {
    addBook("book-1", 1);
    signInAs("user-1", "MEMBER");

    const result = await borrowBook("book-1");

    expect(result).toEqual({ ok: true });
    expect(mocks.state.loans).toHaveLength(1);
    const loan = mocks.state.loans[0];
    expect(loan.status).toBe("ACTIVE");
    expect(loan.bookId).toBe("book-1");
    expect(loan.userId).toBe("user-1");
    const loanLength = loan.dueAt.getTime() - Date.now();
    expect(loanLength).toBeGreaterThan(14 * DAY_MS - 5000);
    expect(loanLength).toBeLessThanOrEqual(14 * DAY_MS);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/books");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/books/book-1");
    expect(mocks.state.lastTransactionOptions).toEqual(
      expectedTransactionOptions,
    );
  });

  it("rejects borrowing when signed out", async () => {
    addBook("book-1", 1);

    const result = await borrowBook("book-1");

    expect(result).toEqual({ ok: false, error: "Not authorized" });
    expect(mocks.state.loans).toHaveLength(0);
  });

  it("rejects borrowing when no copies are available", async () => {
    addBook("book-1", 1);
    addActiveLoan("loan-1", "book-1", "user-2");
    signInAs("user-1", "MEMBER");

    const result = await borrowBook("book-1");

    expect(result).toEqual({ ok: false, error: "No copies available" });
    expect(mocks.state.loans).toHaveLength(1);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects borrowing the same book twice", async () => {
    addBook("book-1", 3);
    addActiveLoan("loan-1", "book-1", "user-1");
    signInAs("user-1", "MEMBER");

    const result = await borrowBook("book-1");

    expect(result).toEqual({
      ok: false,
      error: "You already have this book checked out",
    });
    expect(mocks.state.loans).toHaveLength(1);
  });

  it("returns a friendly error when the transaction times out (P2028)", async () => {
    addBook("book-1", 1);
    signInAs("user-1", "MEMBER");
    mocks.state.transactionError = new Prisma.PrismaClientKnownRequestError(
      "Transaction API error: unable to start a transaction",
      { code: "P2028", clientVersion: "7.8.0" },
    );

    const result = await borrowBook("book-1");

    expect(result).toEqual({
      ok: false,
      error: "The system is busy — please try again.",
    });
    expect(mocks.state.loans).toHaveLength(0);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});

describe("returnBook", () => {
  it("marks the user's own active loan as returned", async () => {
    addBook("book-1", 1);
    addActiveLoan("loan-1", "book-1", "user-1");
    signInAs("user-1", "MEMBER");

    const result = await returnBook("loan-1");

    expect(result).toEqual({ ok: true });
    const loan = mocks.state.loans[0];
    expect(loan.status).toBe("RETURNED");
    expect(loan.returnedAt).toBeInstanceOf(Date);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/books/book-1");
    expect(mocks.state.lastTransactionOptions).toEqual(
      expectedTransactionOptions,
    );
  });

  it("rejects a member returning someone else's loan", async () => {
    addBook("book-1", 1);
    addActiveLoan("loan-1", "book-1", "user-1");
    signInAs("user-2", "MEMBER");

    const result = await returnBook("loan-1");

    expect(result).toEqual({
      ok: false,
      error: "You can only return your own loans",
    });
    const loan = mocks.state.loans[0];
    expect(loan.status).toBe("ACTIVE");
    expect(loan.returnedAt).toBeNull();
  });

  it("lets a librarian return someone else's loan", async () => {
    addBook("book-1", 1);
    addActiveLoan("loan-1", "book-1", "user-1");
    signInAs("librarian-1", "LIBRARIAN");

    const result = await returnBook("loan-1");

    expect(result).toEqual({ ok: true });
    expect(mocks.state.loans[0].status).toBe("RETURNED");
  });

  it("returns a friendly error when the transaction times out (P2028)", async () => {
    addBook("book-1", 1);
    addActiveLoan("loan-1", "book-1", "user-1");
    signInAs("user-1", "MEMBER");
    mocks.state.transactionError = new Prisma.PrismaClientKnownRequestError(
      "Transaction API error: unable to start a transaction",
      { code: "P2028", clientVersion: "7.8.0" },
    );

    const result = await returnBook("loan-1");

    expect(result).toEqual({
      ok: false,
      error: "The system is busy — please try again.",
    });
    expect(mocks.state.loans[0].status).toBe("ACTIVE");
  });
});

describe("createBook authorization", () => {
  it("rejects a signed-in member", async () => {
    signInAs("user-1", "MEMBER");

    const result = await createBook(null, new FormData());

    expect(result).toEqual({ formError: "Not authorized" });
  });

  it("rejects a signed-out caller", async () => {
    const result = await createBook(null, new FormData());

    expect(result).toEqual({ formError: "Not authorized" });
  });
});
