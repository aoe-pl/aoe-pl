"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ErrorToast } from "@/components/ui/error-toast-content";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";
import { CircleSlash, RadioTower } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface MatchStreamPanelProps {
  matchId: string;
  streamUrl: string | null;
  isMarkedByMe: boolean;
}

/**
 * Control that lets a streamer mark a match as going to be
 * streamed, or remove their own stream entry again
 */
export function MatchStreamPanel({
  matchId,
  streamUrl,
  isMarkedByMe,
}: MatchStreamPanelProps) {
  const t = useTranslations("tournament.matches.stream");
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [value, setValue] = useState(streamUrl ?? "");

  const { mutate: mark, isPending: isMarking } =
    api.tournaments.matches.markStream.useMutation({
      onSuccess: () => {
        toast.success(t("marked_toast"));
        setDialogOpen(false);
        router.refresh();
      },
      onError: (err) => {
        // The server rejects with this code when no stream link is available.
        if (err.message === "STREAM_URL_REQUIRED") {
          setValue("");
          setDialogOpen(true);
          return;
        }
        toast.error(<ErrorToast message={err.message} />);
      },
    });

  const { mutate: unmark, isPending: isUnmarking } =
    api.tournaments.matches.unmarkStream.useMutation({
      onSuccess: () => {
        toast.success(t("unmarked_toast"));
        router.refresh();
      },
      onError: (err) => toast.error(<ErrorToast message={err.message} />),
    });

  function handleMarkClick() {
    // Ask for the link when the profile has none stored yet.
    if (!streamUrl) {
      setValue("");
      setDialogOpen(true);
      return;
    }
    mark({ matchId });
  }

  function handleSubmitDialog() {
    const trimmed = value.trim();
    if (!trimmed) return;
    mark({ matchId, streamUrl: trimmed });
  }

  const isPending = isMarking || isUnmarking;

  return (
    <div className="space-y-2 border-t border-[color:var(--medieval-wood-border)] pt-4 text-sm">
      <div className="text-[color:var(--medieval-gold-muted)]">
        {t("title")}
      </div>

      <Button
        size="lg"
        variant={isMarkedByMe ? "wine" : "gold"}
        className="w-full"
        disabled={isPending}
        onClick={() => (isMarkedByMe ? unmark({ matchId }) : handleMarkClick())}
      >
        {isMarkedByMe ? <CircleSlash /> : <RadioTower />}
        {isMarkedByMe ? t("unmark_button") : t("mark_button")}
      </Button>

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dialog_title")}</DialogTitle>
            <DialogDescription>{t("dialog_description")}</DialogDescription>
          </DialogHeader>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t("placeholder")}
            autoFocus
          />
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              disabled={isMarking}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleSubmitDialog}
              disabled={!value.trim() || isMarking}
            >
              {t("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
