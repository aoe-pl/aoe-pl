"use client";

import { slugify } from "@/lib/utils";
import type { TournamentWithRelations } from "@/server/api/tournament";
import { Trophy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface TournamentCardProps {
  tournament: TournamentWithRelations;
}

export function TournamentCard({ tournament }: TournamentCardProps) {
  const bannerUrl = tournament.imageKey
    ? `/api/tournaments/${tournament.id}/banner?v=${encodeURIComponent(
        tournament.imageKey,
      )}`
    : null;

  return (
    <Link
      href={`/tournaments/${slugify(tournament.tournamentSeries!.name)}/${tournament.urlKey}`}
      className="block h-full"
    >
      <div className="wood-tile flex h-full flex-col overflow-hidden rounded-xl p-1.5">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-[color:var(--medieval-wood)]">
          {bannerUrl ? (
            <Image
              src={bannerUrl}
              alt={tournament.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[color:var(--medieval-gold-muted)]">
              <Trophy className="h-10 w-10 opacity-60" />
            </div>
          )}
        </div>
        <div className="mt-1.5 flex flex-1 items-center justify-center rounded-lg border border-[color:var(--medieval-wood-border)] bg-[color:var(--medieval-parchment)] p-4">
          <h3 className="line-clamp-2 text-center text-base leading-tight font-semibold text-[color:var(--medieval-parchment-foreground)]">
            {tournament.name}
          </h3>
        </div>
      </div>
    </Link>
  );
}
