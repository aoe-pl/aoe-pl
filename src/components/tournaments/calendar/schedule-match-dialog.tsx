"use client";

import { Button } from "@/components/ui/button";
import { Calendar24 } from "@/components/ui/calendar-24";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/trpc/react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TournamentMatchRow } from "./hooks/use-calendar-data";

interface ScheduleMatchDialogProps {
  match: TournamentMatchRow;
  defaultDate: Date;
  onClose: () => void;
}

// Dialog for scheduling a match through the calendar.
export function ScheduleMatchDialog({
  match,
  defaultDate,
  onClose,
}: ScheduleMatchDialogProps) {
  const router = useRouter();
  const t = useTranslations("tournament.calendar");
  const [matchDate, setMatchDate] = useState<Date>(defaultDate);
  const [timeValue, setTimeValue] = useState<string>(
    format(defaultDate, "HH:mm:ss"),
  );

  const { mutate, isPending } =
    api.tournaments.matches.scheduleMatch.useMutation({
      onSuccess: () => {
        router.refresh();
        onClose();
      },
    });

  // TODO For team games, show team names instead of player names. This requires some changes to the data fetching to include team info in the match rows.
  const p1 = match.TournamentMatchParticipant[0];
  const p2 = match.TournamentMatchParticipant[1];
  const p1Name = p1?.participant?.nickname ?? "TBD";
  const p2Name = p2?.participant?.nickname ?? "TBD";

  function handleSubmit() {
    mutate({ id: match.id, matchDate });
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("schedule.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm font-medium">
            {p1Name} <span className="text-muted-foreground">vs</span> {p2Name}
          </p>
          {match.group && (
            <p className="text-muted-foreground text-sm">{match.group.name}</p>
          )}
          <Calendar24
            date={matchDate}
            dateLabel={t("schedule.date_label")}
            timeLabel={t("schedule.time_label")}
            onDateChange={(date) => {
              if (date) {
                const [h, m] = timeValue.split(":").map(Number);
                date.setHours(h ?? 0, m ?? 0);
                setMatchDate(date);
              }
            }}
            timeValue={timeValue}
            onTimeChange={(time) => {
              setTimeValue(time);
              const [h, m] = time.split(":").map(Number);
              const updated = new Date(matchDate);
              updated.setHours(h ?? 0, m ?? 0);
              setMatchDate(updated);
            }}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            {t("schedule.cancel_button")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending ? t("schedule.saving") : t("schedule.confirm_button")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
