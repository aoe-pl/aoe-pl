import { ProfileAdminNoteSection } from "@/components/profile/profile-admin-note-section";
import { ProfileAoe2Stats } from "@/components/profile/profile-aoe2-stats";
import { ProfileAoe2CompanionButton } from "@/components/profile/profile-aoe2companion-button";
import { ProfileRolesSection } from "@/components/profile/profile-roles-section";
import { ProfileTournamentHistorySection } from "@/components/profile/profile-tournament-history-section";
import { fetchAoe2CompanionProfile } from "@/lib/aoe2companion";
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
  const availableRoles = isAdmin ? await api.roles.list() : [];

  const isOwnProfile = session?.user?.id === profile.id;

  const companionProfileId = profile.aoe2companionUrl
    ? getPlayerProfileIdFromCompanionUrl(profile.aoe2companionUrl)
    : null;
  const companionProfile = companionProfileId
    ? await fetchAoe2CompanionProfile(companionProfileId)
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-24">
      <div className="panel">
        <header className="flex flex-wrap items-center justify-between gap-4 pb-6">
          <h1
            className="text-3xl font-bold"
            style={{ color: "var(--medieval-gold)" }}
          >
            {profile.name}
          </h1>

          <ProfileAoe2CompanionButton
            userId={profile.id}
            currentUrl={profile.aoe2companionUrl}
            isEditable={isOwnProfile || isAdmin}
          />
        </header>

        <div className="divide-y divide-[color:var(--medieval-wood-border)] border-t border-[color:var(--medieval-wood-border)]">
          {companionProfile && (
            <section className="py-6">
              <ProfileAoe2Stats profile={companionProfile} />
            </section>
          )}

          <section className="py-6">
            <ProfileRolesSection
              userId={profile.id}
              currentUserId={session?.user?.id ?? ""}
              currentRoles={profile.userRoles}
              availableRoles={availableRoles}
              isAdmin={isAdmin}
            />
          </section>

          {isAdmin && (
            <section className="py-6">
              <ProfileAdminNoteSection
                userId={profile.id}
                currentNote={profile.adminComment}
              />
            </section>
          )}

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
