"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { locales } from "@/lib/locales";
import { ChevronDown } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const current =
    locales.list.find((l) => l.code === locale) ?? locales.list[0];

  if (!current) throw new Error("Current locale not found in locales list");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="text-accent flex items-center gap-1 text-sm font-bold">
          <span className="text-base">{current.flag}</span>
          <span>{current.code.toUpperCase()}</span>
          <ChevronDown className="h-4" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        {locales.list.map((l) => (
          <DropdownMenuItem
            key={l.code}
            asChild
          >
            <a
              href={`/api/locale?${locales.key}=${l.code}&returnTo=${encodeURIComponent(pathname)}`}
              className={`text-accent flex items-center`}
            >
              <span className="">{l.flag}</span>
              {l.label}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
