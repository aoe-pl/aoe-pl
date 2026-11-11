"use client";

import { ADMIN_MARKER_META } from "@/components/tournaments/matches/admin-stream-marker";
import { Button } from "@/components/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChevronDown, ListFilter, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AdminStreamStatus } from "@prisma/client";
import {
  CalendarMatchStatus,
  type CalendarGroup,
  type CalendarPlayer,
} from "./types";

interface CalendarFiltersProps {
  groups: CalendarGroup[];
  players: CalendarPlayer[];
  selectedGroups: Set<string>;
  selectedPlayers: Set<string>;
  selectedStatuses: Set<CalendarMatchStatus>;
  selectedAdminMarkers: Set<AdminStreamStatus>;
  showAdminMarkers?: boolean;
  onGroupToggle: (id: string) => void;
  onPlayerToggle: (id: string) => void;
  onStatusToggle: (status: CalendarMatchStatus) => void;
  onAdminMarkerToggle: (marker: AdminStreamStatus) => void;
  onClearAll: () => void;
}

const STATUS_OPTIONS = [
  { value: CalendarMatchStatus.Scheduled, labelKey: "status.scheduled" },
  { value: CalendarMatchStatus.Completed, labelKey: "status.completed" },
] as const;

const ADMIN_MARKER_VALUES = Object.keys(
  ADMIN_MARKER_META,
) as (keyof typeof ADMIN_MARKER_META)[];

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

function CheckboxOption({
  checked,
  onToggle,
  children,
}: {
  checked: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <DropdownMenuItem
      role="menuitemcheckbox"
      aria-checked={checked}
      onSelect={(event) => {
        event.preventDefault();
        onToggle();
      }}
      className={cn(
        "cursor-pointer rounded-none px-3",
        checked && "bg-medieval-gold/20 text-medieval-gold",
      )}
    >
      {children}
    </DropdownMenuItem>
  );
}

function FilterSubTrigger({ label, count }: { label: string; count: number }) {
  return (
    <DropdownMenuSubTrigger className="cursor-pointer rounded-none px-3">
      <span>{label}</span>
      {count > 0 && (
        <span className="text-medieval-gold-muted ml-auto text-xs tabular-nums">
          {count}
        </span>
      )}
    </DropdownMenuSubTrigger>
  );
}

function MobileSection({
  title,
  count,
  open,
  onToggle,
  children,
}: {
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border-medieval-wood-border/60 border-b last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="hover:bg-medieval-gold/10 flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors"
      >
        <span>{title}</span>
        {count > 0 && (
          <span className="text-medieval-gold-muted text-xs tabular-nums">
            {count}
          </span>
        )}
        <ChevronDown
          className={cn(
            "ml-auto h-4 w-4 opacity-60 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

export function CalendarFilters({
  groups,
  players,
  selectedGroups,
  selectedPlayers,
  selectedStatuses,
  selectedAdminMarkers,
  showAdminMarkers = false,
  onGroupToggle,
  onPlayerToggle,
  onStatusToggle,
  onAdminMarkerToggle,
  onClearAll,
}: CalendarFiltersProps) {
  const t = useTranslations("tournament.calendar.filters");
  const tMatches = useTranslations("tournament.matches");

  const [open, setOpen] = useState(false);
  const [playerSearch, setPlayerSearch] = useState("");
  const [mobileSection, setMobileSection] = useState<
    "groups" | "players" | "status" | "admin" | null
  >(null);
  const isMobile = useMediaQuery("(max-width: 639px)");

  const activeCount =
    selectedGroups.size +
    selectedPlayers.size +
    selectedStatuses.size +
    selectedAdminMarkers.size;
  const hasFilter = activeCount > 0;

  const filteredPlayers = useMemo(() => {
    const query = playerSearch.trim().toLowerCase();
    if (!query) return players;
    return players.filter((p) => p.nickname.toLowerCase().includes(query));
  }, [players, playerSearch]);

  const groupOptions = groups.map((group) => (
    <CheckboxOption
      key={group.id}
      checked={selectedGroups.has(group.id)}
      onToggle={() => onGroupToggle(group.id)}
    >
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: group.color }}
      />
      <span className="truncate">{group.name}</span>
    </CheckboxOption>
  ));

  const playerOptions =
    filteredPlayers.length === 0 ? (
      <p className="text-muted-foreground px-3 py-3 text-sm">
        {t("no_players_found")}
      </p>
    ) : (
      filteredPlayers.map((player) => (
        <CheckboxOption
          key={player.id}
          checked={selectedPlayers.has(player.id)}
          onToggle={() => onPlayerToggle(player.id)}
        >
          <span className="truncate">{player.nickname}</span>
        </CheckboxOption>
      ))
    );

  const playerSearchInput = (
    <Input
      placeholder={t("search_players")}
      value={playerSearch}
      onChange={(event) => setPlayerSearch(event.target.value)}
      onKeyDown={(event) => {
        if (event.key !== "Escape") event.stopPropagation();
      }}
      className="h-8"
    />
  );

  const statusOptions = STATUS_OPTIONS.map((status) => (
    <CheckboxOption
      key={status.value}
      checked={selectedStatuses.has(status.value)}
      onToggle={() => onStatusToggle(status.value)}
    >
      <span>{tMatches(status.labelKey)}</span>
    </CheckboxOption>
  ));

  const adminMarkerOptions = ADMIN_MARKER_VALUES.map((value) => {
    const marker = ADMIN_MARKER_META[value];
    const MarkerIcon = marker.icon;

    return (
      <CheckboxOption
        key={value}
        checked={selectedAdminMarkers.has(value)}
        onToggle={() => onAdminMarkerToggle(value)}
      >
        <MarkerIcon className={cn("h-4 w-4 shrink-0", marker.className)} />
        <span>{tMatches(marker.labelKey)}</span>
      </CheckboxOption>
    );
  });

  const clearAllItem = hasFilter ? (
    <>
      <DropdownMenuSeparator className="mx-0" />
      <DropdownMenuItem
        className="rounded-none px-3 text-xs"
        onSelect={(event) => {
          event.preventDefault();
          onClearAll();
        }}
      >
        <X className="h-3.5 w-3.5" />
        {t("clear_all")}
      </DropdownMenuItem>
    </>
  ) : null;

  return (
    <div className="flex flex-col gap-2">
      <DropdownMenu
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setMobileSection(null);
        }}
      >
        <DropdownMenuTrigger asChild>
          <Button
            variant="wood"
            className="focus-visible:border-medieval-wood-border w-fit focus-visible:ring-0"
          >
            <ListFilter className="h-4 w-4 opacity-70" />
            {t("filter_button")}
            {hasFilter && (
              <span className="bg-medieval-gold text-medieval-wood rounded-full px-1.5 py-px text-[10px] leading-none font-bold">
                {activeCount}
              </span>
            )}
            <ChevronDown
              className={cn(
                "h-4 w-4 opacity-60 transition-transform",
                open && "rotate-180",
              )}
            />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          collisionPadding={8}
          className={cn(
            "max-w-[calc(100vw-2rem)] border-black/60 p-0",
            isMobile ? "w-[calc(100vw-2rem)]" : "w-64",
          )}
        >
          {isMobile ? (
            <div className="py-1">
              <MobileSection
                title={t("groups")}
                count={selectedGroups.size}
                open={mobileSection === "groups"}
                onToggle={() =>
                  setMobileSection((current) =>
                    current === "groups" ? null : "groups",
                  )
                }
              >
                <div className="max-h-56 overflow-y-auto">{groupOptions}</div>
              </MobileSection>

              <MobileSection
                title={t("players")}
                count={selectedPlayers.size}
                open={mobileSection === "players"}
                onToggle={() =>
                  setMobileSection((current) =>
                    current === "players" ? null : "players",
                  )
                }
              >
                <div className="border-medieval-wood-border border-b p-2">
                  {playerSearchInput}
                </div>
                <div className="max-h-56 overflow-y-auto">{playerOptions}</div>
              </MobileSection>

              <MobileSection
                title={t("match_status")}
                count={selectedStatuses.size}
                open={mobileSection === "status"}
                onToggle={() =>
                  setMobileSection((current) =>
                    current === "status" ? null : "status",
                  )
                }
              >
                {statusOptions}
              </MobileSection>

              {showAdminMarkers && (
                <MobileSection
                  title={t("admin_marker")}
                  count={selectedAdminMarkers.size}
                  open={mobileSection === "admin"}
                  onToggle={() =>
                    setMobileSection((current) =>
                      current === "admin" ? null : "admin",
                    )
                  }
                >
                  {adminMarkerOptions}
                </MobileSection>
              )}

              {clearAllItem}
            </div>
          ) : (
            <>
              <DropdownMenuSub>
                <FilterSubTrigger
                  label={t("groups")}
                  count={selectedGroups.size}
                />
                <DropdownMenuSubContent className="max-h-[min(70vh,20rem)] w-56 overflow-y-auto border-black/60 p-0">
                  {groupOptions}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSub>
                <FilterSubTrigger
                  label={t("players")}
                  count={selectedPlayers.size}
                />
                <DropdownMenuSubContent className="w-64 border-black/60 p-0">
                  <div className="border-medieval-wood-border border-b p-2">
                    {playerSearchInput}
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    {playerOptions}
                  </div>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSub>
                <FilterSubTrigger
                  label={t("match_status")}
                  count={selectedStatuses.size}
                />
                <DropdownMenuSubContent className="w-48 border-black/60 p-0">
                  {statusOptions}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {showAdminMarkers && (
                <DropdownMenuSub>
                  <FilterSubTrigger
                    label={t("admin_marker")}
                    count={selectedAdminMarkers.size}
                  />
                  <DropdownMenuSubContent className="w-60 border-black/60 p-0">
                    {adminMarkerOptions}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}

              {clearAllItem}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
