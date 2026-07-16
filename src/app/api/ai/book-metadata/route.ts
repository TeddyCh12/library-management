import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { parseBookMetadata } from "@/lib/book-metadata";

const FRIENDLY_ERROR = "Couldn't fetch metadata — please fill manually.";

const requestSchema = z
  .object({
    title: z.string().optional(),
    isbn: z.string().optional(),
  })
  .refine((data) => Boolean(data.title?.trim() || data.isbn?.trim()), {
    message: "Provide a title or ISBN",
  });

const SYSTEM_PROMPT = [
  "You are a library cataloging assistant.",
  "Given a book title (and possibly known facts about it), respond with ONLY a JSON object — no markdown, no code fences, no commentary — of exactly this shape:",
  '{"author": string|null, "genre": string|null, "publishedYear": number|null, "description": string|null}',
  "description is a neutral summary of the book in at most 50 words.",
  "Use null for any field you are not sure about.",
  "If you do not confidently recognize this exact book, return null for every field.",
  "Never invent data.",
].join("\n");

// Facts resolved from Open Library for an ISBN. The nano model cannot map
// bare ISBNs to books truthfully, so ISBNs are resolved here first and the
// model only writes genre and description for the resolved title.
type ResolvedBook = {
  title: string | null;
  author: string | null;
  publishedYear: number | null;
};

async function lookupIsbn(isbn: string): Promise<ResolvedBook | null> {
  try {
    const response = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${encodeURIComponent(isbn)}&format=json&jscmd=data`,
      { signal: AbortSignal.timeout(5_000) },
    );
    if (!response.ok) {
      return null;
    }
    const json = await response.json();
    const entry = json?.[`ISBN:${isbn}`];
    if (!entry) {
      return null;
    }

    const title = typeof entry.title === "string" ? entry.title : null;
    const authors = Array.isArray(entry.authors)
      ? entry.authors
          .map((author: unknown) =>
            author && typeof author === "object" && "name" in author
              ? (author as { name: unknown }).name
              : null,
          )
          .filter((name: unknown): name is string => typeof name === "string")
      : [];
    const yearMatch =
      typeof entry.publish_date === "string"
        ? entry.publish_date.match(/\d{4}/)
        : null;

    return {
      title,
      author: authors.length > 0 ? authors.join(", ") : null,
      publishedYear: yearMatch ? Number(yearMatch[0]) : null,
    };
  } catch {
    return null;
  }
}

function plausibleYear(year: number | null): number | null {
  if (year == null) {
    return null;
  }
  return year >= 1000 && year <= new Date().getFullYear() ? year : null;
}

function errorResponse(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(request: Request) {
  // Same rule as createBook: only librarians may call this — it costs money.
  const session = await auth();
  if (session?.user?.role !== "LIBRARIAN") {
    return errorResponse(403, "Not authorized");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "Provide a title or ISBN");
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, "Provide a title or ISBN");
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return errorResponse(503, FRIENDLY_ERROR);
  }

  const typedTitle = parsed.data.title?.trim() || null;
  const isbn = parsed.data.isbn?.trim().replaceAll("-", "").replaceAll(" ", "");
  const resolved = isbn ? await lookupIsbn(isbn) : null;

  const title = typedTitle ?? resolved?.title ?? null;
  if (!title) {
    // ISBN-only request that Open Library doesn't know: nothing truthful
    // to report.
    return NextResponse.json({
      ok: true,
      data: {
        title: null,
        author: null,
        genre: null,
        publishedYear: null,
        description: null,
      },
    });
  }

  const userPrompt = [
    `Title: ${title}`,
    resolved?.author && `Known author: ${resolved.author}`,
    resolved?.publishedYear && `Known published year: ${resolved.publishedYear}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5.4-nano",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        max_completion_tokens: 400,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      return errorResponse(502, FRIENDLY_ERROR);
    }

    const completion = await response.json();
    const content = completion?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      return errorResponse(502, FRIENDLY_ERROR);
    }

    const metadata = parseBookMetadata(content);
    if (!metadata) {
      return errorResponse(502, FRIENDLY_ERROR);
    }

    // Open Library facts win over model output; the model contributes the
    // fields the catalog record doesn't have.
    return NextResponse.json({
      ok: true,
      data: {
        title: resolved?.title ?? null,
        author: resolved?.author ?? metadata.author,
        genre: metadata.genre,
        publishedYear:
          plausibleYear(resolved?.publishedYear ?? null) ??
          metadata.publishedYear,
        description: metadata.description,
      },
    });
  } catch {
    // Network failure or the 10s timeout — never let this break the form.
    return errorResponse(502, FRIENDLY_ERROR);
  }
}
