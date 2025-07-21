import type { TournamentWithRelations } from "@/server/api/tournament";
import { TournamentStatus } from "./tournament";
import { Badge } from "@/components/ui/badge";
import { translateTournamentStatus } from "@/i18n/i18nStatuses";
import { useTranslations } from "next-intl";

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
  const t = useTranslations();

  return (
    <Badge className={`${statusBadgeClasses[status]}`}>
      {t(translateTournamentStatus(status))}
    </Badge>
  );
}
