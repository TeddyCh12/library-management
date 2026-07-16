import { z } from "zod";

export type BookMetadata = {
  author: string | null;
  genre: string | null;
  publishedYear: number | null;
  description: string | null;
};

const MAX_TEXT_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 600;

// Shape the model is instructed to return; missing fields count as null,
// wrong types fail the parse.
const metadataSchema = z.object({
  author: z.string().nullish(),
  genre: z.string().nullish(),
  publishedYear: z.number().int().nullish(),
  description: z.string().nullish(),
});

function cleanText(value: string | null | undefined, maxLength: number) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.slice(0, maxLength);
}

// Parses and sanity-checks raw model output. Returns null when the output
// is not usable; the caller maps that to a friendly error.
export function parseBookMetadata(
  raw: string,
  currentYear = new Date().getFullYear(),
): BookMetadata | null {
  // Models occasionally wrap JSON in markdown fences despite instructions.
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return null;
  }

  const result = metadataSchema.safeParse(parsed);
  if (!result.success) {
    return null;
  }

  const year = result.data.publishedYear;
  const yearIsPlausible = year != null && year >= 1000 && year <= currentYear;

  return {
    author: cleanText(result.data.author, MAX_TEXT_LENGTH),
    genre: cleanText(result.data.genre, MAX_TEXT_LENGTH),
    publishedYear: yearIsPlausible ? year : null,
    description: cleanText(result.data.description, MAX_DESCRIPTION_LENGTH),
  };
}
