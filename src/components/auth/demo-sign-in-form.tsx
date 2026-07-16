"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { signInWithDemo } from "@/lib/actions/auth";

const demoAccounts = [
  { label: "demo.member@example.com", value: "demo.member@example.com" },
  { label: "demo.librarian@example.com", value: "demo.librarian@example.com" },
];

export function DemoSignInForm({ callbackUrl }: { callbackUrl: string }) {
  const [email, setEmail] = useState(demoAccounts[0].value);
  const [state, formAction, isPending] = useActionState(signInWithDemo, null);

  return (
    <form action={formAction}>
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel>Email</FieldLabel>
          <Select
            items={demoAccounts}
            value={email}
            onValueChange={(value) => {
              if (value) {
                setEmail(value);
              }
            }}
          >
            <SelectTrigger className="w-full" aria-label="Demo account email">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {demoAccounts.map((account) => (
                <SelectItem key={account.value} value={account.value}>
                  {account.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field data-invalid={Boolean(state?.error)}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            required
            aria-invalid={Boolean(state?.error)}
          />
          {state?.error && <FieldError>{state.error}</FieldError>}
        </Field>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Signing in…" : "Sign in with demo account"}
        </Button>
      </FieldGroup>
    </form>
  );
}
