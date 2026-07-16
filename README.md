# Biblio

Biblio is a library management system for managing a catalog, loans, and members, built to be usable by a real library.

**Live demo:** https://biblio-library-management.vercel.app

Mobile responsive, with light and dark mode.

## Try it

Sign in with Google, or use the demo accounts:

* Librarian: demo.librarian@example.com / demo1234
* Member: demo.member@example.com / demo1234

Librarians have full management access: add, edit, and archive books, borrow and return, return any member's loan, and view all loan history. Members can borrow and return books and view their own loans. Signing in with Google creates a member account.

Note: the first load after idle can take a few seconds (free-tier database cold start). It is fast after that.

## Features

* Book management: create, edit, and archive books, with server-side validation (zod) that rejects invalid data
* Check-out and check-in: borrow and return books, with due dates and per-book loan history
* Search by title or author, filter by genre and availability
* Overdue tracking: overdue loans are highlighted with days overdue, and the dashboard has an overdue queue
* Authentication with Google SSO plus demo credentials, and two roles (librarian and member) enforced on the server
* Autofill with AI: type a title or ISBN and the remaining details are filled in for the librarian to review
* Biblio Assistant: a chat panel that answers questions about the catalog and your own loans using live database lookups, and refuses anything else
* Archive instead of delete: archiving is blocked while copies are checked out, archived books keep their loan history, and librarians can restore them
* Loans page: members see their own history, librarians see all loans with status filters
* Librarian dashboard: totals, active and overdue loans, active borrowers, recently added books
* Light and dark mode

## Stack

Next.js 16 (App Router), TypeScript, PostgreSQL on Neon via Prisma 7, NextAuth v5, Tailwind v4 with shadcn/ui, OpenAI gpt-5.4-nano plus the Open Library API for the AI features, Vitest for tests, deployed on Vercel.

I kept the stack deliberately lean. For a system of this size there is no need for extra services like Redis, Docker, or a separate backend. The architecture is right-sized for the problem.

## Design decisions

* Availability is derived, not stored. Active loans are counted against total copies at read time. A stored counter would be a second source of truth that must be updated together with the loans and could drift apart. Deriving it means it is always correct.
* A loan is a full record, not a boolean on the book. A real library needs to know who borrowed a book, when, when it is due, and the full history. A boolean cannot answer any of those questions.
* Borrowing runs inside a Serializable transaction. It checks that active loans are below total copies and that the user does not already hold this book, then creates the loan due in 14 days. The checks and the create happen atomically, so two users cannot both take the last copy at the same instant.
* Validation and role checks live server-side in every action, because hiding a button is not security. The server action is the real boundary. Pages also redirect members away from librarian-only screens for better UX.
* The AI autofill uses the Open Library API for facts (resolving an ISBN to its title, author, and year) and the LLM only for prose (genre and description). It fills empty fields only, never overwrites what the librarian typed, and never submits on its own. The librarian reviews and saves.
* The Biblio Assistant is grounded in the database. It answers only through three predefined read-only lookups that run under the signed-in user's session, so it cannot invent inventory, modify anything, or read other members' data. Off-topic questions get a polite refusal.
* Books are archived, not deleted. Archived books leave the catalog, the filters, and the stats, but keep their full loan history and can be restored. Archived copies do not count toward the library's totals because they are out of circulation. The catalog exclusion lives in one shared query builder rather than being repeated in every query.

## Running locally

1. Clone the repo and run `pnpm install`
2. Copy `.env.example` to `.env` and fill in:
   * `DATABASE_URL` (pooled Postgres connection)
   * `DIRECT_URL` (direct connection, used for migrations and seeding)
   * `AUTH_SECRET` (generate with `npx auth secret`)
   * `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (optional, for Google sign-in)
   * `OPENAI_API_KEY` (for the AI features)
3. `pnpm prisma migrate dev`
4. `pnpm db:seed`
5. `pnpm dev`

Run the tests with `pnpm test`.

## What I would do next

* Due-date email reminders for members
* Reservations and a waitlist for books with no available copies
* Reading history, so members can mark books as read and track their reading
* Pagination for large catalogs