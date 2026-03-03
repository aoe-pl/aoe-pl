"use client";

import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { locales } from "@/lib/locales";

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const current =
    locales.list.find((l) => l.code === locale) ?? locales.list[0];

  if (!current) throw new Error("Current locale not found in locales list");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="text-foreground/80 flex items-center gap-1 text-sm">
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
              className={`flex items-center`}
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
