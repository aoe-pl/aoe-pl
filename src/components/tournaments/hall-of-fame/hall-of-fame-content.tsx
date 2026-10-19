import { TrophyIcon } from "@/components/icons/trophy";
import { PlayerLink } from "@/components/player-link";
import type {
  HallOfFameData,
  HallOfFameGroupResult,
  HallOfFameTournament,
} from "@/lib/helpers/tournament-hall-of-fame";
import { ChevronDown, Trophy } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

function GroupRow({
  group,
  labels,
}: {
  group: HallOfFameGroupResult;
  labels: {
    bracket: string;
  };
}) {
  return (
    <div
      className="grid grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1fr)] items-center gap-2 rounded-xl border border-l-4 border-white/10 bg-black/20 px-4 py-2.5"
      style={{
        borderLeftColor: group.color ?? "var(--medieval-gold)",
        backgroundImage: `linear-gradient(90deg, color-mix(in srgb, ${
          group.color ?? "var(--medieval-gold)"
        } 22%, transparent) 0%, transparent 30%, transparent 70%, color-mix(in srgb, ${
          group.color ?? "var(--medieval-gold)"
        } 22%, transparent) 100%)`,
      }}
    >
      <div className="flex min-w-0 items-center justify-end gap-2">
        {group.isBracket && (
          <span className="border-medieval-gold/30 bg-medieval-gold/10 text-medieval-gold shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">
            {labels.bracket}
          </span>
        )}
        <p className="text-medieval-gold min-w-0 truncate text-right text-sm font-semibold">
          {group.name}
        </p>
      </div>

      <Trophy className="text-medieval-gold mx-auto h-4 w-4" />

      <div className="min-w-0 text-left">
        <span className="text-medieval-gold block truncate font-semibold">
          <PlayerLink
            playerNumber={group.winner.playerNumber ?? undefined}
            name={group.winner.name}
          />
        </span>
      </div>
    </div>
  );
}

function TournamentTree({
  tournament,
  defaultOpen,
  labels,
}: {
  tournament: HallOfFameTournament;
  defaultOpen: boolean;
  labels: {
    bracket: string;
  };
}) {
  return (
    <details
      open={defaultOpen}
      className="panel group overflow-hidden"
    >
      <summary className="border-medieval-wood-border flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 border-b pb-4 [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <div className="border-medieval-gold/30 bg-medieval-gold/10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border">
            <TrophyIcon className="text-medieval-gold h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-foreground truncate text-lg font-bold sm:text-xl">
              {tournament.tournamentName}
            </p>
          </div>
        </div>

        <span className="text-medieval-gold-muted shrink-0 transition-transform group-open:rotate-180">
          <ChevronDown className="h-5 w-5" />
        </span>
      </summary>

      <div className="mx-auto max-w-3xl pt-5">
        <div className="space-y-2">
          {tournament.groups.map((group) => (
            <GroupRow
              key={group.id}
              group={group}
              labels={{
                bracket: labels.bracket,
              }}
            />
          ))}
        </div>
      </div>
    </details>
  );
}

export async function HallOfFameContent({ data }: { data: HallOfFameData }) {
  const t = await getTranslations("hall_of_fame");

  return (
    <div className="mx-auto max-w-5xl px-4 pt-28 pb-16">
      <header className="mb-8 text-center">
        <TrophyIcon className="text-medieval-gold mx-auto mb-4 h-12 w-12 drop-shadow-[0_0_18px_rgba(230,192,82,0.45)]" />
        <h1 className="text-foreground text-4xl font-bold text-balance drop-shadow-lg sm:text-5xl">
          {t("title")}
        </h1>
        <p className="text-medieval-gold mt-3 text-sm font-semibold tracking-[0.3em] uppercase">
          {t("description")}
        </p>
      </header>

      {data.tournaments.length > 0 ? (
        <div className="space-y-6">
          {data.tournaments.map((tournament, index) => (
            <TournamentTree
              key={tournament.tournamentId}
              tournament={tournament}
              defaultOpen={index === 0}
              labels={{
                bracket: t("bracket"),
              }}
            />
          ))}
        </div>
      ) : (
        <section className="panel py-14 text-center">
          <TrophyIcon className="text-medieval-gold-muted/50 mx-auto h-14 w-14" />
          <h2 className="text-medieval-gold mt-4 text-xl font-bold">
            {t("no_results")}
          </h2>
          <p className="text-medieval-gold-muted mx-auto mt-2 max-w-md text-sm">
            {t("no_results_description")}
          </p>
        </section>
      )}

      <div className="mt-8 text-center">
        <Link
          href="/tournaments"
          className="text-medieval-gold hover:text-medieval-gold/80 inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:underline"
        >
          {t("back_to_tournaments")}
        </Link>
      </div>
    </div>
  );
}
