"use client";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, isBrightColor } from "@/lib/utils";
import { Check, ChevronDown, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { CalendarGroup, CalendarPlayer } from "./types";

interface CalendarFiltersProps {
  groups: CalendarGroup[];
  players: CalendarPlayer[];
  selectedGroups: Set<string>;
  selectedPlayers: Set<string>;
  onGroupToggle: (id: string) => void;
  onPlayerToggle: (id: string) => void;
  onClearAll: () => void;
}

const popoverTriggerStyle = cn(
  "flex items-center gap-2 rounded-md border px-3 py-3 text-sm font-medium",
  "hover:bg-muted focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
);

export function CalendarFilters({
  groups,
  players,
  selectedGroups,
  selectedPlayers,
  onGroupToggle,
  onPlayerToggle,
  onClearAll,
}: CalendarFiltersProps) {
  const t = useTranslations("tournament.calendar.filters");
  const [groupsOpen, setGroupsOpen] = useState(false);
  const [playersOpen, setPlayersOpen] = useState(false);

  const hasFilter = selectedGroups.size > 0 || selectedPlayers.size > 0;

  const activeGroups = groups.filter((g) => selectedGroups.has(g.id));
  const activePlayers = players.filter((p) => selectedPlayers.has(p.id));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Groups popover menu*/}
        <Popover
          open={groupsOpen}
          onOpenChange={setGroupsOpen}
        >
          <PopoverTrigger asChild>
            <button
              className={cn(
                popoverTriggerStyle,
                selectedGroups.size > 0
                  ? "border-primary/50 bg-primary/5 text-primary"
                  : "border-border text-muted-foreground",
              )}
            >
              {t("groups")}
              {selectedGroups.size > 0 && (
                <span className="bg-primary text-primary-foreground rounded-full px-1 py-px text-[10px] leading-none font-bold">
                  {selectedGroups.size}
                </span>
              )}
              <ChevronDown className="h-4 w-4 opacity-60" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-56 p-0"
            align="start"
          >
            <Command>
              <CommandList>
                <CommandGroup>
                  {groups.map((g) => {
                    const active = selectedGroups.has(g.id);
                    return (
                      <CommandItem
                        key={g.id}
                        value={g.name}
                        onSelect={() => onGroupToggle(g.id)}
                        className="flex cursor-pointer items-center gap-2"
                      >
                        {/* Color dot */}
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: g.color }}
                        />
                        <span className="flex-1 text-sm">{g.name}</span>
                        {active && (
                          <Check className="text-primary h-3.5 w-3.5 shrink-0" />
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Players popover menu */}
        <Popover
          open={playersOpen}
          onOpenChange={setPlayersOpen}
        >
          <PopoverTrigger asChild>
            <button
              className={cn(
                popoverTriggerStyle,
                selectedPlayers.size > 0
                  ? "border-primary/50 bg-primary/5 text-primary"
                  : "border-border text-muted-foreground",
              )}
            >
              {t("players")}
              {selectedPlayers.size > 0 && (
                <span className="bg-primary text-primary-foreground rounded-full px-1 py-px text-[10px] leading-none font-bold">
                  {selectedPlayers.size}
                </span>
              )}
              <ChevronDown className="h-4 w-4 opacity-60" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-64 p-0"
            align="start"
          >
            <Command>
              <CommandInput placeholder={t("search_players")} />
              <CommandList>
                <CommandEmpty>{t("no_players_found")}</CommandEmpty>
                <CommandGroup>
                  {players.map((p) => {
                    const active = selectedPlayers.has(p.id);
                    return (
                      <CommandItem
                        key={p.id}
                        value={p.nickname}
                        onSelect={() => onPlayerToggle(p.id)}
                        className="flex cursor-pointer items-center justify-between gap-2"
                      >
                        <span className="text-sm">{p.nickname}</span>
                        {active && (
                          <Check className="text-primary h-3.5 w-3.5 shrink-0" />
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Clear all */}
        {hasFilter && (
          <button
            onClick={onClearAll}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
          >
            <X className="h-4 w-4" />
            {t("clear_all")}
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {hasFilter && (
        <div className="flex flex-wrap gap-1.5">
          {activeGroups.map((g) => {
            const textColor = isBrightColor(g.color) ? "#000" : "#fff";

            return (
              <span
                key={g.id}
                className="flex items-center rounded-full px-2 py-2 text-xs"
                style={{ backgroundColor: g.color, color: textColor }}
              >
                {g.name}
                <button
                  onClick={() => onGroupToggle(g.id)}
                  className="opacity-70 hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </span>
            );
          })}

          {activePlayers.map((p) => (
            <span
              key={p.id}
              className="bg-primary/20 flex items-center rounded-full px-2 py-2 text-xs"
            >
              {p.nickname}
              <button
                onClick={() => onPlayerToggle(p.id)}
                className="opacity-70 hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
