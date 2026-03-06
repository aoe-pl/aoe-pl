import {
  TournamentNav,
  TournamentNavMobile,
  type TournamentNavLink,
} from "@/components/tournaments/tournament-nav";
import { getTournamentOrNotFound } from "@/lib/helpers/tournament-page-data";
import { tournamentSectionRepository } from "@/lib/repositories/tournamentSectionRepository";
import { predefinedTournamentSections } from "@/lib/tournaments/section-constants";
import { getLocale, getTranslations } from "next-intl/server";

export default async function TournamentDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ seriesSlug: string; urlKey: string }>;
}) {
  const { seriesSlug, urlKey } = await params;

  const tournament = await getTournamentOrNotFound(seriesSlug, urlKey, {
    includeMatchMode: true,
  });

  const tNav = await getTranslations("tournaments.detail.nav");
  const locale = await getLocale();

  const base = `/tournaments/${seriesSlug}/${urlKey}`;

  const sections = await tournamentSectionRepository.getSectionsByTournamentId(
    tournament.id,
  );

  const links: TournamentNavLink[] = sections
    .filter((s) => s.isVisible)
    .map((s) => ({
      href: `${base}/${s.slug}`,
      label: predefinedTournamentSections.some((ps) => ps.slug === s.slug)
        ? tNav(s.slug.replaceAll("-", "_"))
        : (s.translations.find((tr) => tr.locale === locale)?.title ?? s.slug),
    }));

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
