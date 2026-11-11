"use client";

import { LocaleFlag } from "@/components/icons";
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
import { useEffect, useRef, useState } from "react";

const CLOSE_DELAY_MS = 150;

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimeout.current) clearTimeout(closeTimeout.current);
    };
  }, []);

  const clearCloseTimeout = () => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
  };

  // Close with a short delay so moving the pointer from the trigger into the
  // portal-rendered menu does not dismiss it.
  const handleOpen = () => {
    clearCloseTimeout();
    setOpen(true);
  };

  const handleClose = () => {
    clearCloseTimeout();
    closeTimeout.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  };

  const current =
    locales.list.find((l) => l.code === locale) ?? locales.list[0];

  if (!current) throw new Error("Current locale not found in locales list");

  return (
    <DropdownMenu
      open={open}
      onOpenChange={setOpen}
      modal={false}
    >
      <DropdownMenuTrigger asChild>
        <button
          className="text-accent flex items-center gap-1 text-sm font-bold focus:outline-none"
          onMouseEnter={handleOpen}
          onMouseLeave={handleClose}
        >
          <LocaleFlag
            locale={current.code}
            className="h-3.5"
          />
          <ChevronDown className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
      >
        {locales.list.map((l) => (
          <DropdownMenuItem
            key={l.code}
            asChild
          >
            <a
              href={`/api/locale?${locales.key}=${l.code}&returnTo=${encodeURIComponent(pathname)}`}
              className="text-accent-foreground flex items-center gap-2"
            >
              <LocaleFlag locale={l.code} />
              {l.label}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
