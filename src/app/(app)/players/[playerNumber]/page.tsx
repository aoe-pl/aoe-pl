import { ProfileAdminNoteSection } from "@/components/profile/profile-admin-note-section";
import { ProfileAoe2CompanionSection } from "@/components/profile/profile-aoe2companion-section";
import { ProfileRolesSection } from "@/components/profile/profile-roles-section";
import { ProfileTournamentHistorySection } from "@/components/profile/profile-tournament-history-section";
import { getIsAdmin, getSession } from "@/lib/session";
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
  const availableRoles = isAdmin ? await api.roles.list() : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-24">
      <h1 className="text-foreground mb-8 text-3xl font-bold">
        {profile.name}
      </h1>

      <div className="space-y-6">
        <ProfileRolesSection
          userId={profile.id}
          currentUserId={session?.user?.id ?? ""}
          currentRoles={profile.userRoles}
          availableRoles={availableRoles}
          isAdmin={isAdmin}
        />

        <ProfileAoe2CompanionSection
          currentUrl={profile.aoe2companionUrl}
          isEditable={isOwnProfile}
        />

        {isAdmin && (
          <ProfileAdminNoteSection
            userId={profile.id}
            currentNote={profile.adminComment}
          />
        )}

        <ProfileTournamentHistorySection
          participants={profile.TournamentParticipant}
        />
      </div>
    </div>
  );
}
