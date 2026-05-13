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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/trpc/react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TournamentMatchRow } from "./hooks/use-calendar-data";

interface UserScheduleDialogProps {
  pendingRows: TournamentMatchRow[];
  userId: string;
  defaultDate: Date;
  onClose: () => void;
}

interface MatchOption {
  matchId: string;
  userName: string;
  opponentName: string;
  groupName: string | null;
}

export function UserScheduleDialog({
  pendingRows,
  userId,
  defaultDate,
  onClose,
}: UserScheduleDialogProps) {
  const router = useRouter();
  const t = useTranslations("tournament.calendar");
  const [matchDate, setMatchDate] = useState<Date>(defaultDate);
  const [timeValue, setTimeValue] = useState<string>(
    format(defaultDate, "HH:mm:ss"),
  );
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const { mutate, isPending } =
    api.tournaments.matches.scheduleMatch.useMutation({
      onSuccess: () => {
        router.refresh();
        onClose();
      },
    });

  const options: MatchOption[] = pendingRows.flatMap((row) => {
    const user = row.TournamentMatchParticipant.find(
      (p) => p.participant?.userId === userId,
    );
    const opponent = row.TournamentMatchParticipant.find(
      (p) => p.participant?.userId !== userId,
    );

    if (!user || !opponent) return [];

    const userName = user.participant?.nickname ?? "TBD";
    const opponentName = opponent.participant?.nickname ?? "TBD";

    return [
      {
        matchId: row.id,
        userName,
        opponentName,
        groupName: row.group?.name ?? null,
      },
    ];
  });

  const selected = options.find((o) => o.matchId === selectedMatchId) ?? null;

  function handleSubmit() {
    if (!selectedMatchId) return;
    mutate({ id: selectedMatchId, matchDate });
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
          <DialogTitle>{t("schedule.title_user")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Opponent picker */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium">
              {t("schedule.opponent_label")}
            </p>
            <Select
              value={selectedMatchId ?? ""}
              onValueChange={(v) => setSelectedMatchId(v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("schedule.select_opponent")} />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem
                    key={opt.matchId}
                    value={opt.matchId}
                  >
                    {opt.opponentName}
                    {opt.groupName && (
                      <span className="text-muted-foreground ml-2 text-xs">
                        {opt.groupName}
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Player names preview */}
          {selected && (
            <p className="text-sm">
              <span className="font-medium">{selected.userName}</span>
              <span className="text-muted-foreground"> vs </span>
              <span className="font-medium">{selected.opponentName}</span>
            </p>
          )}

          {/* Date + time */}
          <Calendar24
            date={matchDate}
            dateLabel={t("schedule.date_label")}
            timeLabel={t("schedule.time_label")}
            onDateChange={(date) => {
              if (date) {
                const [h, m, s] = timeValue.split(":").map(Number);
                date.setHours(h ?? 0, m ?? 0, s ?? 0);
                setMatchDate(date);
              }
            }}
            timeValue={timeValue}
            onTimeChange={(time) => {
              setTimeValue(time);
              const [h, m, s] = time.split(":").map(Number);
              const updated = new Date(matchDate);
              updated.setHours(h ?? 0, m ?? 0, s ?? 0);
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
            disabled={isPending || !selectedMatchId}
          >
            {isPending ? t("schedule.saving") : t("schedule.confirm_button")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
