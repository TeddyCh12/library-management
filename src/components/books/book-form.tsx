"use client";

import { useActionState } from "react";
import Link from "next/link";

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

export function BookForm({
  action,
  defaultValues,
  submitLabel,
  cancelHref,
}: {
  action: BookFormAction;
  defaultValues?: BookFormDefaults;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, isPending] = useActionState(action, null);

  function errorsFor(field: string) {
    return state?.fieldErrors?.[field]?.map((message) => ({ message }));
  }

  function isInvalid(field: string) {
    return Boolean(state?.fieldErrors?.[field]?.length);
  }

  return (
    <form action={formAction}>
      <FieldGroup>
        <Field data-invalid={isInvalid("title")}>
          <FieldLabel htmlFor="title">Title *</FieldLabel>
          <Input
            id="title"
            name="title"
            defaultValue={defaultValues?.title}
            aria-invalid={isInvalid("title")}
          />
          <FieldError errors={errorsFor("title")} />
        </Field>

        <Field data-invalid={isInvalid("author")}>
          <FieldLabel htmlFor="author">Author *</FieldLabel>
          <Input
            id="author"
            name="author"
            defaultValue={defaultValues?.author}
            aria-invalid={isInvalid("author")}
          />
          <FieldError errors={errorsFor("author")} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={isInvalid("isbn")}>
            <FieldLabel htmlFor="isbn">ISBN</FieldLabel>
            <Input
              id="isbn"
              name="isbn"
              defaultValue={defaultValues?.isbn ?? ""}
              aria-invalid={isInvalid("isbn")}
            />
            <FieldError errors={errorsFor("isbn")} />
          </Field>

          <Field data-invalid={isInvalid("genre")}>
            <FieldLabel htmlFor="genre">Genre</FieldLabel>
            <Input
              id="genre"
              name="genre"
              defaultValue={defaultValues?.genre ?? ""}
              aria-invalid={isInvalid("genre")}
            />
            <FieldError errors={errorsFor("genre")} />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={isInvalid("publishedYear")}>
            <FieldLabel htmlFor="publishedYear">Published year</FieldLabel>
            <Input
              id="publishedYear"
              name="publishedYear"
              type="number"
              defaultValue={defaultValues?.publishedYear ?? ""}
              aria-invalid={isInvalid("publishedYear")}
            />
            <FieldError errors={errorsFor("publishedYear")} />
          </Field>

          <Field data-invalid={isInvalid("totalCopies")}>
            <FieldLabel htmlFor="totalCopies">Total copies *</FieldLabel>
            <Input
              id="totalCopies"
              name="totalCopies"
              type="number"
              min={1}
              defaultValue={defaultValues?.totalCopies ?? 1}
              aria-invalid={isInvalid("totalCopies")}
            />
            <FieldError errors={errorsFor("totalCopies")} />
          </Field>
        </div>

        <Field data-invalid={isInvalid("coverUrl")}>
          <FieldLabel htmlFor="coverUrl">Cover URL</FieldLabel>
          <Input
            id="coverUrl"
            name="coverUrl"
            type="url"
            placeholder="https://covers.openlibrary.org/b/isbn/…"
            defaultValue={defaultValues?.coverUrl ?? ""}
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
            defaultValue={defaultValues?.description ?? ""}
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
