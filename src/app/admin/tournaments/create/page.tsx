import { TournamentForm } from "@/lib/admin-panel/tournaments/tournament-form";

export default function CreateTournamentPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Tournament creation</h1>
      <TournamentForm />
    </div>
  );
}
