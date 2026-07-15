"use client";

import { useState } from "react";
import Image from "next/image";
import { BookOpenIcon } from "lucide-react";

export function BookCover({
  coverUrl,
  title,
}: {
  coverUrl: string | null;
  title: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!coverUrl || failed) {
    return (
      <div className="flex aspect-[2/3] w-full items-center justify-center bg-muted">
        <BookOpenIcon className="size-10 text-muted-foreground" aria-hidden />
      </div>
    );
  }

  return (
    <div className="relative aspect-[2/3] w-full bg-muted">
      <Image
        src={coverUrl}
        alt={`Cover of ${title}`}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        className="object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
