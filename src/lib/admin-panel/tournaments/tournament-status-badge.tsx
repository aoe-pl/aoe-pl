import type { TournamentWithRelations } from "@/server/api/tournament";
import { TournamentStatus } from "./tournament";
import { Badge } from "@/components/ui/badge";

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
  return <Badge className={`${statusBadgeClasses[status]}`}>{status}</Badge>;
}
