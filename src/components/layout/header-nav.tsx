"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function HeaderNav({
  showLoans,
  showDashboard,
}: {
  showLoans: boolean;
  showDashboard: boolean;
}) {
  const pathname = usePathname();

  function linkClass(href: string) {
    return cn(
      "transition-colors",
      pathname === href
        ? "font-medium text-primary"
        : "text-muted-foreground hover:text-foreground",
    );
  }

  return (
    <nav className="flex items-center gap-4 text-sm">
      {showLoans && (
        <Link href="/loans" className={linkClass("/loans")}>
          Loans
        </Link>
      )}
      {showDashboard && (
        <Link href="/dashboard" className={linkClass("/dashboard")}>
          Dashboard
        </Link>
      )}
    </nav>
  );
}
