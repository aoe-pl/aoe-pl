"use client";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorToast } from "@/components/ui/error-toast-content";
import { api } from "@/trpc/react";
import { Download, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  RecordingsUploadDialog,
  type RecordingsUploadDialogProps,
} from "./recordings-upload-dialog";

interface MatchRecordingsPanelProps extends RecordingsUploadDialogProps {
  hasRecordings: boolean;
  isApproved: boolean;
}

/**
 * Right-panel recordings controls.
 */
export function MatchRecordingsPanel({
  hasRecordings,
  isApproved,
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
      />
    );
  }

  return (
    <div className="space-y-2">
      <Button
        size="lg"
        variant="gold"
        className="w-full"
        asChild
      >
        <a
          href={`/api/tournaments/matches/${matchId}/recordings`}
          download
        >
          <Download />
          {t("download_button")}
        </a>
      </Button>

      {!isApproved && (
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
