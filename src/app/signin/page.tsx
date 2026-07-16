import type { Metadata } from "next";

import { DemoSignInForm } from "@/components/auth/demo-sign-in-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldSeparator } from "@/components/ui/field";
import { signInWithGoogle } from "@/lib/actions/auth";
import { googleConfigured } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const rawCallbackUrl = Array.isArray(params.callbackUrl)
    ? params.callbackUrl[0]
    : params.callbackUrl;
  const callbackUrl = rawCallbackUrl?.startsWith("/")
    ? rawCallbackUrl
    : "/books";

  return (
    <main className="mx-auto w-full max-w-sm px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Sign in to borrow books from the library.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {googleConfigured && (
            <>
              <form action={signInWithGoogle}>
                <input type="hidden" name="callbackUrl" value={callbackUrl} />
                <Button type="submit" variant="outline" className="w-full">
                  Continue with Google
                </Button>
              </form>
              <FieldSeparator>Demo accounts</FieldSeparator>
            </>
          )}
          {!googleConfigured && (
            <p className="text-sm text-muted-foreground">
              Demo accounts (Google sign-in appears once OAuth is configured):
            </p>
          )}
          <DemoSignInForm callbackUrl={callbackUrl} />
        </CardContent>
      </Card>
    </main>
  );
}
