import { DiscordRoleSyncTester } from "@/lib/admin-panel/discord-roles/discord-role-sync-tester";
import { api } from "@/trpc/server";

export default async function AdminDiscordRolesPage() {
  const tournaments = await api.tournaments.list({
    sortByStatus: true,
    archived: false,
  });

  return (
    <DiscordRoleSyncTester
      tournaments={tournaments.map(({ id, name }) => ({ id, name }))}
    />
  );
}
