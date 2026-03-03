"use client";

import { LayoutGrid } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { NavLink } from "./series-sidebar";

interface SeriesSelectProps {
  navLinks: NavLink[];
  selectedSeriesId: string | null;
  seriesLabel: string;
  onSelect: (id: string | null) => void;
}

export function SeriesSelect({
  navLinks,
  selectedSeriesId,
  seriesLabel,
  onSelect,
}: SeriesSelectProps) {
  return (
    <div className="mb-6 md:hidden">
      <p className="text-muted-foreground mb-2 px-1 text-xs font-semibold tracking-wider uppercase">
        {seriesLabel}
      </p>
      <Select
        value={selectedSeriesId ?? "all"}
        onValueChange={(v) => onSelect(v === "all" ? null : v)}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {navLinks.map((link) => (
            <SelectItem
              key={link.id ?? "all"}
              value={link.id ?? "all"}
            >
              <span className="flex items-center gap-2">
                {link.id === null && (
                  <LayoutGrid className="h-4 w-4 shrink-0" />
                )}
                {link.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
