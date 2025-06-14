import type { TournamentWithRelations } from "@/server/api/tournament";
import { TournamentStatus } from "./tournament";

const statusBadgeClasses = {
  [TournamentStatus.PENDING]: "bg-yellow-600",
  [TournamentStatus.ACTIVE]: "bg-green-600",
  [TournamentStatus.FINISHED]: "bg-blue-600",
  [TournamentStatus.CANCELLED]: "bg-red-600",
};

export function TournamentStatusBadge({
  status,
}: {
  status: TournamentWithRelations["status"];
}) {
  return (
    <span
      className={`rounded px-2 py-1 text-xs font-semibold text-white ${statusBadgeClasses[status]}`}
    >
      {status}
    </span>
  );
}
