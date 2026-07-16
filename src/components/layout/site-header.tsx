import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { signOutAction } from "@/lib/actions/auth";
import { auth } from "@/lib/auth";

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <Link href="/books" className="font-heading text-xl font-semibold">
            Biblio
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {user && (
              <Link
                href="/loans"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Loans
              </Link>
            )}
            {user?.role === "LIBRARIAN" && (
              <Link
                href="/dashboard"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Dashboard
              </Link>
            )}
          </nav>
        </div>
        {user ? (
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Avatar className="size-7">
              {user.image && <AvatarImage src={user.image} alt="" />}
              <AvatarFallback>
                {(user.name ?? user.email ?? "?").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium max-sm:hidden">
              {user.name ?? user.email}
            </span>
            <Badge variant="secondary" className="max-sm:hidden">
              {user.role === "LIBRARIAN" ? "Librarian" : "Member"}
            </Badge>
            <form action={signOutAction}>
              <Button variant="ghost" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <ThemeToggle />
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
      </div>
    </header>
  );
}
