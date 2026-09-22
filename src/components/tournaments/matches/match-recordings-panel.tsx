"use client";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorToast } from "@/components/ui/error-toast-content";
import { api } from "@/trpc/react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  MatchRecordingsDownload,
  type GameRecordingInfo,
} from "./match-recordings-download";
import {
  RecordingsUploadDialog,
  type RecordingsUploadDialogProps,
} from "./recordings-upload-dialog";

interface MatchRecordingsPanelProps extends RecordingsUploadDialogProps {
  hasRecordings: boolean;
  isApproved: boolean;
  canManageRecordings: boolean;
  gamesWithRecordings: GameRecordingInfo[];
}

/**
 * Right-panel recordings controls.
 */
export function MatchRecordingsPanel({
  hasRecordings,
  isApproved,
  canManageRecordings,
  gamesWithRecordings,
  matchId,
  ...dialogProps
}: MatchRecordingsPanelProps) {
  const router = useRouter();
  const t = useTranslations("tournament.matches.recordings");
  const [isClearing, setIsClearing] = useState(false);

  const { mutateAsync: clearRecordings } =
    api.tournaments.matches.clearRecordings.useMutation();

  const handleClear = async () => {
    setIsClearing(true);

    try {
      await clearRecordings({ matchId });
      toast.success(t("cleared_toast"));
      router.refresh();
    } catch (error) {
      toast.error(
        <ErrorToast
          message={error instanceof Error ? error.message : t("clear_error")}
        />,
      );
    } finally {
      setIsClearing(false);
    }
  };

  if (!hasRecordings) {
    return (
      <RecordingsUploadDialog
        {...dialogProps}
        matchId={matchId}
        canManageRecordings={canManageRecordings}
      />
    );
  }

  return (
    <div className="space-y-2">
      <MatchRecordingsDownload
        matchId={matchId}
        gameCount={dialogProps.gameCount ?? 5}
        gamesWithRecordings={gamesWithRecordings}
      />

      {!isApproved && canManageRecordings && (
        <ConfirmDialog
          trigger={
            <Button
              size="lg"
              variant="wine"
              className="w-full"
              disabled={isClearing}
            >
              <Trash2 />
              {isClearing ? t("clearing") : t("clear_button")}
            </Button>
          }
          title={t("clear_confirm_title")}
          description={t("clear_confirm_description")}
          cancelLabel={t("clear_confirm_cancel")}
          confirmLabel={t("clear_confirm_button")}
          onConfirm={() => void handleClear()}
        />
      )}
    </div>
  );
}
