import { ProfileAdminNoteSection } from "@/components/profile/profile-admin-note-section";
import { ProfileAoe2Matches } from "@/components/profile/profile-aoe2-matches";
import { ProfileAoe2Stats } from "@/components/profile/profile-aoe2-stats";
import { ProfileAoe2CompanionButton } from "@/components/profile/profile-aoe2companion-button";
import { ProfileRoleBadges } from "@/components/profile/profile-role-badges";
import { ProfileStreamButton } from "@/components/profile/profile-stream-button";
import { ProfileTournamentHistorySection } from "@/components/profile/profile-tournament-history-section";
import { ProfileUpcomingMatchesSection } from "@/components/profile/profile-upcoming-matches-section";
import { getIsAdmin, getSession } from "@/lib/session";
import { getPlayerProfileIdFromCompanionUrl } from "@/lib/utils";
import { api } from "@/trpc/server";
import { notFound } from "next/navigation";

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ playerNumber: string }>;
}) {
  const { playerNumber } = await params;
  const playerNumberInt = Number(playerNumber);
  if (!Number.isInteger(playerNumberInt) || playerNumberInt <= 0) notFound();

  const [profile, isAdmin] = await Promise.all([
    api.users.getPublicProfile({ playerNumber: playerNumberInt }),
    getIsAdmin(),
  ]);

  if (!profile) notFound();

  const session = await getSession();

  const isOwnProfile = session?.user?.id === profile.id;

  const participantIds = profile.TournamentParticipant.map((p) => p.id);
  const teamIds = profile.TournamentParticipant.map((p) => p.teamId).filter(
    (id): id is string => Boolean(id),
  );

  const companionProfileId = profile.aoe2companionUrl
    ? getPlayerProfileIdFromCompanionUrl(profile.aoe2companionUrl)
    : null;

  const [companionProfile, companionMatches] = await Promise.all([
    companionProfileId
      ? api.aoe2companion.getProfile({ profileId: companionProfileId })
      : Promise.resolve(null),
    companionProfileId
      ? api.aoe2companion.getMatches({
          profileId: companionProfileId,
          leaderboardId: "rm_1v1",
          count: 5,
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-24">
      <div className="panel">
        <header className="flex flex-wrap items-start justify-between gap-4 pb-6">
          <div className="space-y-2">
            <h1
              className="text-3xl font-bold"
              style={{ color: "var(--medieval-gold)" }}
            >
              {profile.name}
            </h1>
            <ProfileRoleBadges roles={profile.userRoles} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ProfileAoe2CompanionButton
              userId={profile.id}
              currentUrl={profile.aoe2companionUrl}
              isEditable={isOwnProfile || isAdmin}
            />
            <ProfileStreamButton
              userId={profile.id}
              currentUrl={profile.streamUrl}
              isEditable={isOwnProfile || isAdmin}
            />
          </div>
        </header>

        <div className="divide-y divide-[color:var(--medieval-wood-border)] border-t border-[color:var(--medieval-wood-border)]">
          {companionProfile && (
            <section className="py-6">
              <ProfileAoe2Stats profile={companionProfile} />
            </section>
          )}

          {companionProfileId && companionMatches.length > 0 && (
            <section className="py-6">
              <ProfileAoe2Matches
                profileId={companionProfileId}
                matches={companionMatches}
              />
            </section>
          )}

          {isAdmin && (
            <section className="py-6">
              <ProfileAdminNoteSection
                userId={profile.id}
                currentNote={profile.adminComment}
              />
            </section>
          )}

          <section className="py-6">
            <ProfileUpcomingMatchesSection
              matches={profile.upcomingMatches}
              participantIds={participantIds}
              teamIds={teamIds}
            />
          </section>

          <section className="py-6">
            <ProfileTournamentHistorySection
              participants={profile.TournamentParticipant}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
