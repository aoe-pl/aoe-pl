"use client";

import { ScheduleMatchDialog } from "@/components/tournaments/calendar/schedule-match-dialog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { api } from "@/trpc/react";
import { CalendarPlus, CalendarX } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface MatchSchedulePanelProps {
  matchId: string;
  matchDate: Date | null;
  player1Name: string;
  player2Name: string;
  groupName: string | null;
}

/**
 * Right-panel scheduling controls for a single match. Lets admins or the
 * match participants set/reschedule the match date and clear it again.
 */
export function MatchSchedulePanel({
  matchId,
  matchDate,
  player1Name,
  player2Name,
  groupName,
}: MatchSchedulePanelProps) {
  const router = useRouter();
  const t = useTranslations("tournament.calendar");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { mutate: unschedule, isPending } =
    api.tournaments.matches.unscheduleMatch.useMutation({
      onSuccess: () => router.refresh(),
    });

  const isScheduled = matchDate !== null;

  return (
    <div className="space-y-2 text-sm">
      <div className="text-[color:var(--medieval-gold-muted)]">
        {t("schedule.panel_title")}
      </div>

      {dialogOpen && (
        <ScheduleMatchDialog
          matchId={matchId}
          defaultDate={matchDate ?? new Date()}
          player1Name={player1Name}
          player2Name={player2Name}
          groupName={groupName}
          onClose={() => setDialogOpen(false)}
        />
      )}

      <Button
        size="lg"
        variant="gold"
        className="w-full"
        onClick={() => setDialogOpen(true)}
      >
        <CalendarPlus />
        {isScheduled ? t("schedule.reschedule") : t("schedule.set_date_button")}
      </Button>

      {isScheduled && (
        <ConfirmDialog
          trigger={
            <Button
              size="lg"
              variant="wine"
              className="w-full"
              disabled={isPending}
            >
              <CalendarX />
              {t("schedule.clear_date_button")}
            </Button>
          }
          title={t("schedule.clear_date_confirm_title")}
          description={t("schedule.clear_date_confirm_description")}
          cancelLabel={t("schedule.cancel_button")}
          confirmLabel={t("schedule.clear_date_confirm_button")}
          onConfirm={() => unschedule({ id: matchId })}
        />
      )}
    </div>
  );
}
