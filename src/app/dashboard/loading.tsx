import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-44" />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-xl" />
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-32" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-full" />
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-11 w-full" />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-44" />
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-2/3" />
          ))}
        </div>
      </div>
    </main>
  );
}
