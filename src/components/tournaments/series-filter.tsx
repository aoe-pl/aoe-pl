"use client";

import { cn } from "@/lib/utils";
import { LayoutGrid } from "lucide-react";

interface NavLink {
  id: string | null;
  label: string;
}

interface SeriesFilterProps {
  navLinks: NavLink[];
  selectedSeriesId: string | null;
  seriesLabel: string;
  onSelect: (id: string | null) => void;
}

export function SeriesFilter({
  navLinks,
  selectedSeriesId,
  seriesLabel,
  onSelect,
}: SeriesFilterProps) {
  return (
    <div className="border-b border-[color:var(--medieval-wood-border)] pb-4">
      <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
        {seriesLabel}
      </p>
      <div className="flex flex-wrap gap-2">
        {navLinks.map((link) => {
          const isActive = selectedSeriesId === link.id;

          return (
            <button
              key={link.id ?? "all"}
              type="button"
              onClick={() => onSelect(link.id)}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted border-transparent",
              )}
            >
              {link.id === null && <LayoutGrid className="h-4 w-4 shrink-0" />}
              {link.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
