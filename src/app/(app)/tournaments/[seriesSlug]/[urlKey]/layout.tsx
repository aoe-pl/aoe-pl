import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  TournamentNav,
  TournamentNavMobile,
  type TournamentNavLink,
} from "@/components/tournaments/tournament-nav";
import { tournamentRepository } from "@/lib/repositories/tournamentRepository";
import { tournamentSeriesRepository } from "@/lib/repositories/tournamentSeriesRepository";
import { slugify } from "@/lib/utils";

export default async function TournamentDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ seriesSlug: string; urlKey: string }>;
}) {
  const { seriesSlug, urlKey } = await params;
  const t = await getTranslations("tournaments.detail");

  const allSeries = await tournamentSeriesRepository.getTournamentSeries();
  const series = allSeries.find((s) => slugify(s.name) === seriesSlug);

  if (!series) notFound();

  const tournament = await tournamentRepository.getTournamentBySeriesAndUrlKey(
    series.id,
    urlKey,
    { includeMatchMode: true },
  );

  if (!tournament) {
    notFound();
  }

  const base = `/tournaments/${seriesSlug}/${urlKey}`;

  const links: TournamentNavLink[] = [
    { href: `${base}/information`, label: t("nav.information") },
    { href: `${base}/registration`, label: t("nav.registration") },
    { href: `${base}/awards`, label: t("nav.awards") },
    { href: `${base}/first-steps`, label: t("nav.first_steps") },
    { href: `${base}/calendar`, label: t("nav.calendar") },
    { href: `${base}/groups`, label: t("nav.groups") },
    { href: `${base}/rules`, label: t("nav.rules") },
    { href: `${base}/players`, label: t("nav.players") },
  ];

  return (
    <>
      <div className="mx-auto max-w-4xl px-4 pt-28 pb-8">
        <div className="mb-4 text-center">
          <h1 className="text-foreground mb-4 text-4xl font-bold text-balance drop-shadow-lg sm:text-5xl">
            {tournament.name}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Mobile dropdown */}
        <div className="mb-6 md:hidden">
          <TournamentNavMobile links={links} />
        </div>

        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden w-52 shrink-0 md:block">
            <div className="sticky top-24">
              <TournamentNav links={links} />
            </div>
          </aside>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </>
  );
}
