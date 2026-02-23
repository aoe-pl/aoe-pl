"use client";

import Link from "next/link";
import { slugify } from "@/lib/utils";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { TournamentWithRelations } from "@/server/api/tournament";

interface TournamentCardProps {
  tournament: TournamentWithRelations;
}

export function TournamentCard({ tournament }: TournamentCardProps) {
  return (
    <Link
      href={`/tournaments/${slugify(tournament.tournamentSeries!.name)}/${tournament.urlKey}`}
      className="group block"
    >
      <Card className="group-hover:border-primary/50 h-full duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg leading-tight">
              {tournament.name}
            </CardTitle>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
