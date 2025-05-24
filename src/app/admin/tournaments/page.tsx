import { TournamentList } from "@/lib/admin-panel/tournaments/TournamentList";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// https://trpc.io/docs/client/react/server-components
// how to use prefetch on server to hydrate client
export default async function AdminTournamentsPage() {
  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Tournaments</h1>
        <Link href="/admin/tournaments/create">
          <Button className="bg-yellow-600 text-white hover:bg-yellow-500">
            + Create Tournament
          </Button>
        </Link>
      </div>
      <TournamentList />
    </>
  );
}
