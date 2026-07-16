import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getBookAvailability,
  getMyLoans,
  searchBooks,
} from "@/lib/assistant-tools";
import { auth } from "@/lib/auth";

const FRIENDLY_ERROR = "Sorry, I could not check that right now.";
const MAX_MESSAGE_LENGTH = 500;
const HISTORY_LIMIT = 6;
const MAX_TOOL_ITERATIONS = 3;
const REQUEST_DEADLINE_MS = 15_000;

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(MAX_MESSAGE_LENGTH),
      }),
    )
    .min(1)
    .max(50),
});

const SYSTEM_PROMPT = [
  "You are Biblio Assistant, the helper of a small library app.",
  "You may only answer questions about this library's catalog and the signed-in user's own loans.",
  "Always use the provided tools to look up facts; answer strictly from tool results and never invent titles, availability, or dates.",
  "If a question is not about this library's catalog or the user's loans, reply with exactly one polite sentence declining, and nothing else.",
  "You cannot see other members' loans and must say so if asked.",
  "Keep every answer to at most 3 sentences.",
  "Reply in plain text only: no markdown, no asterisks, no bullet lists.",
].join("\n");

const toolDefinitions = [
  {
    type: "function",
    function: {
      name: "searchBooks",
      description:
        "Search the library catalog. Returns up to 5 books with availability.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Match against title or author" },
          genre: { type: "string" },
          availableOnly: { type: "boolean" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getBookAvailability",
      description: "Available copies of the best matching title.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getMyLoans",
      description: "The signed-in user's own loans with due dates and status.",
      parameters: { type: "object", properties: {} },
    },
  },
];

// Lightweight per-user rate limit. In-memory means per server instance and
// reset on restart, which is fine at this scale; swap for a shared store
// (e.g. Upstash) if the app ever runs on more than one instance.
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;
const requestLog = new Map<string, number[]>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const recent = (requestLog.get(userId) ?? []).filter(
    (time) => now - time < RATE_WINDOW_MS,
  );
  if (recent.length >= RATE_LIMIT) {
    requestLog.set(userId, recent);
    return true;
  }
  recent.push(now);
  requestLog.set(userId, recent);
  return false;
}

async function runTool(
  name: string,
  rawArgs: string,
  userId: string,
): Promise<unknown> {
  let args: Record<string, unknown> = {};
  try {
    args = JSON.parse(rawArgs || "{}");
  } catch {
    return { error: "invalid arguments" };
  }

  switch (name) {
    case "searchBooks":
      return searchBooks({
        query: typeof args.query === "string" ? args.query : undefined,
        genre: typeof args.genre === "string" ? args.genre : undefined,
        availableOnly: args.availableOnly === true,
      });
    case "getBookAvailability":
      return getBookAvailability({
        title: typeof args.title === "string" ? args.title : "",
      });
    case "getMyLoans":
      // Always the session user; the model cannot ask for anyone else.
      return getMyLoans(userId);
    default:
      return { error: `unknown tool ${name}` };
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, error: "Not authorized" },
      { status: 401 },
    );
  }
  const userId = session.user.id;

  if (isRateLimited(userId)) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please wait a minute." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request" },
      { status: 400 },
    );
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid request" },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: FRIENDLY_ERROR },
      { status: 503 },
    );
  }

  const deadline = Date.now() + REQUEST_DEADLINE_MS;
  const history = parsed.data.messages.slice(-HISTORY_LIMIT);
  const messages: unknown[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
  ];

  try {
    for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        throw new Error("deadline exceeded");
      }

      const isLastIteration = iteration === MAX_TOOL_ITERATIONS - 1;
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-5.4-nano",
            messages,
            tools: toolDefinitions,
            // Force a final answer on the last allowed iteration.
            tool_choice: isLastIteration ? "none" : "auto",
            max_completion_tokens: 400,
          }),
          signal: AbortSignal.timeout(remaining),
        },
      );
      if (!response.ok) {
        throw new Error(`openai ${response.status}`);
      }

      const completion = await response.json();
      const message = completion?.choices?.[0]?.message;
      const toolCalls = message?.tool_calls;

      if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
        const reply = typeof message?.content === "string" ? message.content : "";
        if (!reply) {
          throw new Error("empty reply");
        }
        return NextResponse.json({ ok: true, reply });
      }

      messages.push(message);
      for (const call of toolCalls) {
        const result = await runTool(
          call.function?.name ?? "",
          call.function?.arguments ?? "{}",
          userId,
        );
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
    }
    throw new Error("tool loop exhausted");
  } catch {
    return NextResponse.json(
      { ok: false, error: FRIENDLY_ERROR },
      { status: 502 },
    );
  }
}
