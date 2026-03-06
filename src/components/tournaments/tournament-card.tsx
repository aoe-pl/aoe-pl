"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { slugify } from "@/lib/utils";
import type { TournamentWithRelations } from "@/server/api/tournament";
import Link from "next/link";

interface TournamentCardProps {
  tournament: TournamentWithRelations;
}

export function TournamentCard({ tournament }: TournamentCardProps) {
  return (
    <Link
      href={`/tournaments/${slugify(tournament.tournamentSeries!.name)}/${tournament.urlKey}`}
      className="group block"
    >
      <Card className="group-hover:bg-accent/20 bg-accent-foreground/80 h-full duration-200">
        <CardHeader className="flex h-full items-center justify-center p-4">
          <CardTitle className="text-center text-lg leading-tight">
            {tournament.name}
          </CardTitle>
        </CardHeader>
      </Card>
    </Link>
  );
}
