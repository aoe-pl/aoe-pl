import { ProfileAdminNoteSection } from "@/components/profile/profile-admin-note-section";
import { ProfileAoe2CompanionSection } from "@/components/profile/profile-aoe2companion-section";
import { ProfileRolesSection } from "@/components/profile/profile-roles-section";
import { ProfileTournamentHistorySection } from "@/components/profile/profile-tournament-history-section";
import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) {
    redirect("/api/auth/signin");
  }

  const profile = await api.users.getOwnProfile();
  if (!profile) redirect("/");

  const isAdmin = await api.users.isAdmin();
  const availableRoles = isAdmin ? await api.roles.list() : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-24">
      <h1 className="text-foreground mb-8 text-3xl font-bold">
        {profile.name}
      </h1>

      <div className="space-y-6">
        <ProfileRolesSection
          userId={profile.id}
          currentUserId={session.user.id}
          currentRoles={profile.userRoles}
          availableRoles={availableRoles}
          isAdmin={isAdmin}
        />

        <ProfileAoe2CompanionSection
          currentUrl={profile.aoe2companionUrl}
          isEditable={true}
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
