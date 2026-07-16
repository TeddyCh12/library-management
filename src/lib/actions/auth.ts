"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/lib/auth";

export type SignInState = { error?: string } | null;

// Only same-site paths are allowed as post-login destinations.
function safeCallbackUrl(value: FormDataEntryValue | null): string {
  return typeof value === "string" && value.startsWith("/") ? value : "/books";
}

export async function signInWithDemo(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: safeCallbackUrl(formData.get("callbackUrl")),
    });
    return null;
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password" };
    }
    // Successful sign-in redirects by throwing; let that propagate.
    throw error;
  }
}

export async function signInWithGoogle(formData: FormData) {
  await signIn("google", {
    redirectTo: safeCallbackUrl(formData.get("callbackUrl")),
  });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/books" });
}
