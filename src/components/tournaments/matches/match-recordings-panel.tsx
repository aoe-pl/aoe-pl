"use client";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorToast } from "@/components/ui/error-toast-content";
import { api } from "@/trpc/react";
import { Download, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  RecordingsUploadDialog,
  type RecordingsUploadDialogProps,
} from "./recordings-upload-dialog";

interface MatchRecordingsPanelProps extends RecordingsUploadDialogProps {
  hasRecordings: boolean;
}

/**
 * Right-panel recordings controls.
 */
export function MatchRecordingsPanel({
  hasRecordings,
  matchId,
  ...dialogProps
}: MatchRecordingsPanelProps) {
  const router = useRouter();
  const [isClearing, setIsClearing] = useState(false);

  const { mutateAsync: clearRecordings } =
    api.tournaments.matches.clearRecordings.useMutation();

  const handleClear = async () => {
    setIsClearing(true);

    try {
      await clearRecordings({ matchId });
      toast.success("Recordings cleared");
      router.refresh();
    } catch (error) {
      toast.error(
        <ErrorToast
          message={
            error instanceof Error
              ? error.message
              : "Failed to clear recordings"
          }
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
        className="w-full"
        asChild
      >
        <a
          href={`/api/tournaments/matches/${matchId}/recordings`}
          download
        >
          <Download />
          Download Recs
        </a>
      </Button>

      <ConfirmDialog
        trigger={
          <Button
            size="lg"
            variant="destructive"
            className="w-full"
            disabled={isClearing}
          >
            <Trash2 />
            {isClearing ? "Clearing…" : "Clear Recs"}
          </Button>
        }
        title="Clear recordings?"
        description="This permanently deletes every recording saved for this match, including the game results. This cannot be undone."
        cancelLabel="Cancel"
        confirmLabel="Clear recordings"
        onConfirm={() => void handleClear()}
      />
    </div>
  );
}
