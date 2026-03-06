"use client";

import { cn } from "@/lib/utils";
import { LayoutGrid } from "lucide-react";

export interface NavLink {
  id: string | null;
  label: string;
}

interface SeriesSidebarProps {
  navLinks: NavLink[];
  selectedSeriesId: string | null;
  seriesLabel: string;
  onSelect: (id: string | null) => void;
}

export function SeriesSidebar({
  navLinks,
  selectedSeriesId,
  seriesLabel,
  onSelect,
}: SeriesSidebarProps) {
  return (
    <div className="panel hidden shrink-0 md:block">
      <aside className="hidden w-52 shrink-0 md:block">
        <div className="sticky top-24">
          <p className="text-muted-foreground mb-2 px-3 text-xs font-semibold tracking-wider uppercase">
            {seriesLabel}
          </p>
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <button
                key={link.id ?? "all"}
                onClick={() => onSelect(link.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
                  selectedSeriesId === link.id
                    ? "bg-primary/10 text-primary border-primary/30 border"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                {link.id === null && (
                  <LayoutGrid className="h-4 w-4 shrink-0" />
                )}
                {link.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>
    </div>
  );
}
