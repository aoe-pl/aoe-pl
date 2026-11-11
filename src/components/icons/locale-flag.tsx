import type { Locale } from "@/lib/locales";
import { cn } from "@/lib/utils";
import Image from "next/image";

// Keyed by locale so adding a locale without a flag is a type error.
const flags: Record<Locale, { src: string; width: number; height: number }> = {
  pl: { src: "/pl.svg", width: 8, height: 5 },
  en: { src: "/uk.svg", width: 50, height: 30 },
};

interface LocaleFlagProps {
  locale: Locale;
  className?: string;
}

export function LocaleFlag({ locale, className }: LocaleFlagProps) {
  const flag = flags[locale];

  return (
    <Image
      src={flag.src}
      width={flag.width}
      height={flag.height}
      alt=""
      aria-hidden
      unoptimized
      className={cn(
        "h-4 w-auto shrink-0 rounded-[2px] ring-1 ring-black/10",
        className,
      )}
    />
  );
}
