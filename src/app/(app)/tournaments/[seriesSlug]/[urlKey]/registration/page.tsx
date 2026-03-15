import { RegistrationPanel } from "@/components/tournaments/registration/registration-panel";
import { TournamentSectionContent } from "@/components/tournaments/tournament-section-content";
import { getTournamentPageData } from "@/lib/helpers/tournament-page-data";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { getLocale } from "next-intl/server";

export default async function TournamentRegistrationPage({
  params,
}: {
  params: Promise<{ seriesSlug: string; urlKey: string }>;
}) {
  const { seriesSlug, urlKey } = await params;

  const [locale, session, { tournament, section }] = await Promise.all([
    getLocale(),
    auth(),
    getTournamentPageData(seriesSlug, urlKey, "registration"),
  ]);

  const content =
    section?.translations.find((tr) => tr.locale === locale)?.content ?? "";

  const existing = session?.user?.id
    ? await db.tournamentParticipant.findFirst({
        where: { userId: session.user.id, tournamentId: tournament.id },
        select: { id: true },
      })
    : null;

  return (
    <div className="space-y-4">
      {content && <TournamentSectionContent content={content} />}

      <RegistrationPanel
        tournamentId={tournament.id}
        isLoggedIn={!!session?.user}
        isAlreadyRegistered={!!existing}
      />
    </div>
  );
}
