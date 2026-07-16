import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

// Redirect unauthenticated visitors of the librarian form pages to /signin.
// Role checks live in the server actions; this only requires a session.
export default auth((request) => {
  if (!request.auth) {
    const signInUrl = new URL("/signin", request.nextUrl);
    signInUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: ["/books/new", "/books/:id/edit"],
};
