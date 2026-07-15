"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SEARCH_DEBOUNCE_MS = 300;

const availabilityItems = [
  { label: "All books", value: "all" },
  { label: "Available now", value: "available" },
  { label: "All copies out", value: "out" },
];

export function BookFilters({ genres }: { genres: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const genreItems = [
    { label: "All genres", value: "all" },
    ...genres.map((genre) => ({ label: genre, value: genre })),
  ];

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setParam("q", value.trim());
    }, SEARCH_DEBOUNCE_MS);
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative sm:max-w-xs sm:flex-1">
        <SearchIcon
          className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          placeholder="Search by title or author"
          aria-label="Search books"
          className="pl-8"
          value={search}
          onChange={(event) => handleSearchChange(event.target.value)}
        />
      </div>
      <Select
        items={genreItems}
        value={searchParams.get("genre") ?? "all"}
        onValueChange={(value) =>
          setParam("genre", value && value !== "all" ? value : "")
        }
      >
        <SelectTrigger aria-label="Filter by genre" className="sm:w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {genreItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        items={availabilityItems}
        value={searchParams.get("availability") ?? "all"}
        onValueChange={(value) =>
          setParam("availability", value && value !== "all" ? value : "")
        }
      >
        <SelectTrigger aria-label="Filter by availability" className="sm:w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availabilityItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
