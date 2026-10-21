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

const GROUP_SUFFIX_PATTERN = /(?:\s+(?:\d+|[A-Z]+))+$/u;
const TEXT_SHADOW = "0 1px 1px rgba(0,0,0,0.8), 0 1px 4px rgba(0,0,0,0.55)";

interface HallOfFameLabels {
  bracket: string;
  groupNumber: (number: string) => string;
}

interface HallOfFameSection {
  key: string;
  title: string;
  entries: HallOfFameGroupResult[];
}

function getSectionTitle(name: string) {
  return name.replace(GROUP_SUFFIX_PATTERN, "").trim() || name.trim();
}

function groupEntriesByPrefix(entries: HallOfFameGroupResult[]) {
  const sections = new Map<string, HallOfFameSection>();

  for (const entry of entries) {
    const title = getSectionTitle(entry.name);
    const key = title.toLocaleLowerCase();
    const section = sections.get(key);

    if (section) {
      section.entries.push(entry);
    } else {
      sections.set(key, { key, title, entries: [entry] });
    }
  }

  return Array.from(sections.values());
}

function getEntryLabel(
  entry: HallOfFameGroupResult,
  section: HallOfFameSection,
  labels: HallOfFameLabels,
) {
  const suffix = entry.name.slice(section.title.length).trim();

  if (/^\d+$/u.test(suffix)) {
    return labels.groupNumber(suffix);
  }

  if (suffix) return suffix;

  return entry.isBracket ? labels.bracket : null;
}

function getSectionAccent(section: HallOfFameSection) {
  const color = section.entries[0]?.color ?? "var(--medieval-gold)";

  return `color-mix(in srgb, ${color} 82%, white)`;
}

function WinnerNames({
  winners,
}: {
  winners: HallOfFameGroupResult["winners"];
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-0.5 text-center">
      {winners.map((winner, index) => (
        <span
          key={`${winner.playerNumber ?? "guest"}-${winner.name}-${index}`}
          className="text-medieval-gold block truncate text-lg font-bold sm:text-xl"
        >
          <PlayerLink
            playerNumber={winner.playerNumber ?? undefined}
            name={winner.name}
          />
        </span>
      ))}
    </div>
  );
}

function ChampionCard({ section }: { section: HallOfFameSection }) {
  const accent = getSectionAccent(section);

  return (
    <section
      className="relative overflow-hidden rounded-2xl border px-5 py-4"
      style={{
        borderColor: `color-mix(in srgb, ${accent} 50%, transparent)`,
        backgroundImage: `linear-gradient(135deg, color-mix(in srgb, ${accent} 28%, transparent) 0%, color-mix(in srgb, ${accent} 12%, transparent) 100%)`,
        boxShadow: `0 0 32px color-mix(in srgb, ${accent} 14%, transparent)`,
        textShadow: TEXT_SHADOW,
      }}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-medieval-gold text-xl font-bold sm:text-2xl">
          {section.title}
        </span>

        <span className="bg-medieval-gold/20 h-px w-full" />

        <Trophy className="text-medieval-gold h-5 w-5 shrink-0" />

        <div className="flex flex-col items-center gap-0.5">
          {section.entries.flatMap((entry) =>
            entry.winners.map((winner, index) => (
              <span
                key={`${entry.id}-${winner.playerNumber ?? "guest"}-${winner.name}-${index}`}
                className="text-medieval-gold text-xl font-bold sm:text-2xl"
              >
                <PlayerLink
                  playerNumber={winner.playerNumber ?? undefined}
                  name={winner.name}
                />
              </span>
            )),
          )}
        </div>
      </div>
    </section>
  );
}

function DivisionCard({
  section,
  labels,
}: {
  section: HallOfFameSection;
  labels: HallOfFameLabels;
}) {
  const accent = getSectionAccent(section);

  return (
    <section
      className="rounded-xl border p-4"
      style={{
        borderColor: `color-mix(in srgb, ${accent} 55%, transparent)`,
        backgroundImage: `linear-gradient(135deg, color-mix(in srgb, ${accent} 28%, transparent) 0%, color-mix(in srgb, ${accent} 8%, transparent) 75%, transparent 100%)`,
        textShadow: TEXT_SHADOW,
      }}
    >
      <header className="border-medieval-gold/20 mb-3 flex min-w-0 items-center justify-center gap-2 border-b pb-2">
        <h3 className="text-medieval-gold truncate text-xl font-bold">
          {section.title}
        </h3>
      </header>

      <div className="space-y-3">
        {section.entries.map((entry) => {
          const label = getEntryLabel(entry, section, labels);

          return (
            <div
              key={entry.id}
              className="flex min-w-0 flex-col items-center gap-0.5 text-center"
            >
              {label && (
                <span className="text-medieval-gold-muted text-sm font-bold tracking-wide">
                  {label}
                </span>
              )}
              <WinnerNames winners={entry.winners} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TournamentTree({
  tournament,
  defaultOpen,
  labels,
}: {
  tournament: HallOfFameTournament;
  defaultOpen: boolean;
  labels: HallOfFameLabels;
}) {
  const [championSection, ...divisionSections] = groupEntriesByPrefix(
    tournament.groups,
  );

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

      <div className="mx-auto max-w-4xl space-y-4 pt-5">
        {championSection && <ChampionCard section={championSection} />}

        {divisionSections.length > 0 && (
          <div
            className={
              divisionSections.length > 1
                ? "grid gap-4 sm:grid-cols-2"
                : "grid gap-4"
            }
          >
            {divisionSections.map((section) => (
              <DivisionCard
                key={section.key}
                section={section}
                labels={labels}
              />
            ))}
          </div>
        )}
      </div>
    </details>
  );
}

export async function HallOfFameContent({ data }: { data: HallOfFameData }) {
  const t = await getTranslations("hall_of_fame");
  const labels: HallOfFameLabels = {
    bracket: t("bracket"),
    groupNumber: (number) => t("group_number", { number }),
  };

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
              labels={labels}
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
