import { Skeleton } from "@/components/ui/skeleton";

export default function LoansLoading() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-9 w-72" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-full" />
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-11 w-full" />
          ))}
        </div>
      </div>
    </main>
  );
}
