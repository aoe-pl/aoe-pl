"use client";

import type { TournamentNavGroup } from "@/lib/helpers/tournament-nav";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

interface TournamentsNavLinkProps {
  groups: TournamentNavGroup[];
  label: string;
  className: string;
}

export function TournamentsNavLink({
  groups,
  label,
  className,
}: TournamentsNavLinkProps) {
  const [open, setOpen] = useState(false);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimeout = () => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
  };

  const handleOpen = () => {
    clearCloseTimeout();
    setOpen(true);
  };

  const handleClose = () => {
    clearCloseTimeout();
    closeTimeout.current = setTimeout(() => setOpen(false), 150);
  };

  if (groups.length === 0) {
    return (
      <Link
        href="/tournaments"
        className={className}
      >
        {label}
      </Link>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
      onFocus={handleOpen}
      onBlur={handleClose}
    >
      <Link
        href="/tournaments"
        className={cn(className, "flex items-center gap-1")}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {label}
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
        />
      </Link>

      {open && (
        <div className="menu-medieval absolute top-full left-0 z-50 mt-1 w-64 overflow-hidden rounded-md border shadow-lg">
          <div className="max-h-[70vh] overflow-y-auto py-1">
            {groups.map((group) => (
              <div
                key={group.seriesName}
                className="py-1"
              >
                <p className="text-muted-foreground px-3 py-1 text-xs font-semibold tracking-wider uppercase">
                  {group.seriesName}
                </p>
                {group.tournaments.map((tournament) => (
                  <Link
                    key={tournament.href}
                    href={tournament.href}
                    className="text-foreground/90 hover:bg-accent/10 hover:text-accent block truncate rounded-sm px-3 py-1.5 text-sm"
                  >
                    {tournament.name}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface TournamentsMobileMenuProps {
  groups: TournamentNavGroup[];
  label: string;
  linkClassName: string;
  onNavigate: () => void;
}

export function TournamentsMobileMenu({
  groups,
  label,
  linkClassName,
  onNavigate,
}: TournamentsMobileMenuProps) {
  const [open, setOpen] = useState(false);

  if (groups.length === 0) {
    return (
      <Link
        href="/tournaments"
        className={linkClassName}
        onClick={onNavigate}
      >
        {label}
      </Link>
    );
  }

  return (
    <div>
      <div className="flex items-center">
        <Link
          href="/tournaments"
          className={cn(linkClassName, "flex-1")}
          onClick={onNavigate}
        >
          {label}
        </Link>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={label}
          className="text-foreground/80 hover:text-accent p-2 transition-colors"
        >
          <ChevronDown
            className={cn("h-5 w-5 transition-transform", open && "rotate-180")}
          />
        </button>
      </div>

      {open && (
        <div className="border-primary/20 mt-1 ml-2 flex flex-col gap-1 border-l pl-3">
          {groups.map((group) => (
            <div key={group.seriesName}>
              <p className="text-muted-foreground px-4 py-1 text-xs font-semibold tracking-wider uppercase">
                {group.seriesName}
              </p>
              {group.tournaments.map((tournament) => (
                <Link
                  key={tournament.href}
                  href={tournament.href}
                  className="text-foreground/80 hover:text-accent hover:bg-accent/10 block rounded-md px-4 py-1.5 text-sm"
                  onClick={onNavigate}
                >
                  {tournament.name}
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
