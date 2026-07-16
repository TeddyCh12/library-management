"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BookOpenTextIcon, SendIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const MAX_MESSAGE_LENGTH = 500;

export function AssistantWidget({ isSignedIn }: { isSignedIn: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isPending, setIsPending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, isPending]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const content = input.trim();
    if (!content || isPending) {
      return;
    }

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content },
    ];
    setMessages(nextMessages);
    setInput("");
    setIsPending(true);
    try {
      const response = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.slice(-6) }),
      });
      const result = await response.json();
      const reply =
        response.ok && result.ok
          ? result.reply
          : (result.error ?? "Sorry, I could not check that right now.");
      setMessages((previous) => [
        ...previous,
        { role: "assistant", content: reply },
      ]);
    } catch {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: "Sorry, I could not check that right now.",
        },
      ]);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            size="icon-lg"
            className="fixed right-4 bottom-4 z-40 rounded-full shadow-lg"
            aria-label="Open Biblio Assistant"
          />
        }
      >
        <BookOpenTextIcon />
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Biblio Assistant</SheetTitle>
          <SheetDescription>
            Ask about the catalog or your own loans.
          </SheetDescription>
        </SheetHeader>

        {isSignedIn ? (
          <>
            <div className="flex-1 overflow-y-auto px-4">
              <div className="flex flex-col gap-2 pb-2">
                {messages.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Try &ldquo;Do you have Dune available?&rdquo; or
                    &ldquo;When are my loans due?&rdquo;
                  </p>
                )}
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                      message.role === "user"
                        ? "self-end bg-primary text-primary-foreground"
                        : "self-start bg-muted",
                    )}
                  >
                    {message.content}
                  </div>
                ))}
                {isPending && (
                  <div className="self-start rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                    Thinking…
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </div>
            <form
              onSubmit={handleSubmit}
              className="flex gap-2 border-t p-4"
            >
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask the assistant"
                aria-label="Message for the assistant"
                maxLength={MAX_MESSAGE_LENGTH}
                disabled={isPending}
              />
              <Button
                type="submit"
                size="icon"
                aria-label="Send message"
                disabled={isPending || input.trim() === ""}
              >
                <SendIcon />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-start gap-3 px-4">
            <p className="text-sm text-muted-foreground">
              Sign in to use the assistant.
            </p>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/signin" />}
            >
              Sign in
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
