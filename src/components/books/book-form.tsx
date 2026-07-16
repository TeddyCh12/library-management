"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { SparklesIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { BookFormState } from "@/lib/actions/books";
import type { BookMetadata } from "@/lib/book-metadata";

type BookFormAction = (
  prevState: BookFormState,
  formData: FormData,
) => Promise<BookFormState>;

type BookFormDefaults = {
  title: string;
  author: string;
  isbn: string | null;
  genre: string | null;
  publishedYear: number | null;
  description: string | null;
  coverUrl: string | null;
  totalCopies: number;
};

type FormValues = {
  title: string;
  author: string;
  isbn: string;
  genre: string;
  publishedYear: string;
  description: string;
  coverUrl: string;
  totalCopies: string;
};

function initialValues(defaults?: BookFormDefaults): FormValues {
  return {
    title: defaults?.title ?? "",
    author: defaults?.author ?? "",
    isbn: defaults?.isbn ?? "",
    genre: defaults?.genre ?? "",
    publishedYear: defaults?.publishedYear?.toString() ?? "",
    description: defaults?.description ?? "",
    coverUrl: defaults?.coverUrl ?? "",
    totalCopies: defaults?.totalCopies.toString() ?? "1",
  };
}

export function BookForm({
  action,
  defaultValues,
  submitLabel,
  cancelHref,
  showAutofill,
}: {
  action: BookFormAction;
  defaultValues?: BookFormDefaults;
  submitLabel: string;
  cancelHref: string;
  showAutofill: boolean;
}) {
  const [state, formAction, isPending] = useActionState(action, null);
  const [values, setValues] = useState(() => initialValues(defaultValues));
  const [isAutofilling, setIsAutofilling] = useState(false);

  function setValue(key: keyof FormValues, value: string) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  function errorsFor(field: string) {
    return state?.fieldErrors?.[field]?.map((message) => ({ message }));
  }

  function isInvalid(field: string) {
    return Boolean(state?.fieldErrors?.[field]?.length);
  }

  const canAutofill =
    values.title.trim() !== "" || values.isbn.trim() !== "";

  async function handleAutofill() {
    setIsAutofilling(true);
    try {
      const response = await fetch("/api/ai/book-metadata", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: values.title.trim() || undefined,
          isbn: values.isbn.trim() || undefined,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        toast.error(result.error ?? "Couldn't fetch metadata. Please fill manually.");
        return;
      }

      // Fill only fields the librarian has left empty. Never overwrite.
      const data = result.data as BookMetadata & { title: string | null };
      let filledAnything = false;
      function fill(current: string, incoming: string | null) {
        if (current.trim() === "" && incoming) {
          filledAnything = true;
          return incoming;
        }
        return current;
      }
      setValues({
        ...values,
        title: fill(values.title, data.title),
        author: fill(values.author, data.author),
        genre: fill(values.genre, data.genre),
        publishedYear: fill(
          values.publishedYear,
          data.publishedYear != null ? String(data.publishedYear) : null,
        ),
        description: fill(values.description, data.description),
      });
      if (filledAnything) {
        toast.success("Fields filled. Please review before saving");
      } else {
        toast.info("No metadata found. Please fill manually");
      }
    } catch {
      toast.error("Couldn't fetch metadata. Please fill manually.");
    } finally {
      setIsAutofilling(false);
    }
  }

  return (
    <form action={formAction}>
      <FieldGroup>
        <Field data-invalid={isInvalid("title")}>
          <FieldLabel htmlFor="title">Title *</FieldLabel>
          <Input
            id="title"
            name="title"
            value={values.title}
            onChange={(event) => setValue("title", event.target.value)}
            aria-invalid={isInvalid("title")}
          />
          <FieldError errors={errorsFor("title")} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={isInvalid("isbn")}>
            <FieldLabel htmlFor="isbn">ISBN</FieldLabel>
            <Input
              id="isbn"
              name="isbn"
              value={values.isbn}
              onChange={(event) => setValue("isbn", event.target.value)}
              aria-invalid={isInvalid("isbn")}
            />
            <FieldError errors={errorsFor("isbn")} />
          </Field>

          <Field data-invalid={isInvalid("author")}>
            <FieldLabel htmlFor="author">Author *</FieldLabel>
            <Input
              id="author"
              name="author"
              value={values.author}
              onChange={(event) => setValue("author", event.target.value)}
              aria-invalid={isInvalid("author")}
            />
            <FieldError errors={errorsFor("author")} />
          </Field>
        </div>

        {showAutofill && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canAutofill || isAutofilling}
              onClick={handleAutofill}
            >
              <SparklesIcon /> {isAutofilling ? "Filling…" : "Autofill with AI"}
            </Button>
            <span className="text-xs text-muted-foreground">
              Fills empty fields from the title or ISBN. Review before saving.
            </span>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={isInvalid("genre")}>
            <FieldLabel htmlFor="genre">Genre</FieldLabel>
            <Input
              id="genre"
              name="genre"
              value={values.genre}
              onChange={(event) => setValue("genre", event.target.value)}
              aria-invalid={isInvalid("genre")}
            />
            <FieldError errors={errorsFor("genre")} />
          </Field>

          <Field data-invalid={isInvalid("publishedYear")}>
            <FieldLabel htmlFor="publishedYear">Published year</FieldLabel>
            <Input
              id="publishedYear"
              name="publishedYear"
              type="number"
              value={values.publishedYear}
              onChange={(event) => setValue("publishedYear", event.target.value)}
              aria-invalid={isInvalid("publishedYear")}
            />
            <FieldError errors={errorsFor("publishedYear")} />
          </Field>
        </div>

        <Field data-invalid={isInvalid("totalCopies")}>
          <FieldLabel htmlFor="totalCopies">Total copies *</FieldLabel>
          <Input
            id="totalCopies"
            name="totalCopies"
            type="number"
            min={1}
            value={values.totalCopies}
            onChange={(event) => setValue("totalCopies", event.target.value)}
            aria-invalid={isInvalid("totalCopies")}
            className="sm:max-w-[calc(50%-0.625rem)]"
          />
          <FieldError errors={errorsFor("totalCopies")} />
        </Field>

        <Field data-invalid={isInvalid("coverUrl")}>
          <FieldLabel htmlFor="coverUrl">Cover URL</FieldLabel>
          <Input
            id="coverUrl"
            name="coverUrl"
            type="url"
            placeholder="https://covers.openlibrary.org/b/isbn/…"
            value={values.coverUrl}
            onChange={(event) => setValue("coverUrl", event.target.value)}
            aria-invalid={isInvalid("coverUrl")}
          />
          <FieldError errors={errorsFor("coverUrl")} />
        </Field>

        <Field data-invalid={isInvalid("description")}>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea
            id="description"
            name="description"
            rows={4}
            value={values.description}
            onChange={(event) => setValue("description", event.target.value)}
            aria-invalid={isInvalid("description")}
          />
          <FieldError errors={errorsFor("description")} />
        </Field>

        {state?.formError && <FieldError>{state.formError}</FieldError>}

        <div className="flex gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : submitLabel}
          </Button>
          <Button
            variant="ghost"
            nativeButton={false}
            render={<Link href={cancelHref} />}
          >
            Cancel
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
