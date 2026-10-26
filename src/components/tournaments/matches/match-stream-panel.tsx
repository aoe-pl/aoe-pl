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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/trpc/react";
import type { StreamType } from "@prisma/client";
import { CircleSlash, RadioTower } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface MatchStreamPanelProps {
  matchId: string;
  streamUrl: string | null;
  isMarkedByMe: boolean;
  myStreamType: StreamType | null;
}

/**
 * Control that lets any signed-in user mark a match as going to be streamed,
 * optionally specifying whether they will stream POV or commentate. Multiple
 * users can mark the same match.
 */
export function MatchStreamPanel({
  matchId,
  streamUrl,
  isMarkedByMe,
  myStreamType,
}: MatchStreamPanelProps) {
  const t = useTranslations("tournament.matches.stream");
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [value, setValue] = useState(streamUrl ?? "");
  const [streamType, setStreamType] = useState<StreamType | null>(
    myStreamType ?? null,
  );

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

  function openDialog() {
    setValue(streamUrl ?? "");
    setStreamType(myStreamType ?? null);
    setDialogOpen(true);
  }

  function handleSubmitDialog() {
    if (!streamType) return;

    const trimmed = value.trim();
    mark({
      matchId,
      streamUrl: trimmed || undefined,
      streamType,
    });
  }

  const isPending = isMarking || isUnmarking;

  return (
    <div className="border-medieval-wood-border space-y-2 border-t pt-4 text-sm">
      <div className="text-medieval-gold-muted">{t("title")}</div>

      <Button
        size="lg"
        variant="gold"
        className="w-full"
        disabled={isPending}
        onClick={openDialog}
      >
        <RadioTower />
        {isMarkedByMe ? t("update_button") : t("mark_button")}
      </Button>

      {isMarkedByMe && (
        <Button
          size="lg"
          variant="wine"
          className="w-full"
          disabled={isPending}
          onClick={() => unmark({ matchId })}
        >
          <CircleSlash />
          {t("unmark_button")}
        </Button>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dialog_title")}</DialogTitle>
            <DialogDescription>{t("dialog_description")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={t("placeholder")}
              autoFocus
            />

            <div className="space-y-2">
              <div className="text-sm font-medium">{t("type_label")}</div>
              <Select
                value={streamType ?? ""}
                onValueChange={(next) => setStreamType(next as StreamType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("type.placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POV">{t("type.pov")}</SelectItem>
                  <SelectItem value="COMMENTARY">
                    {t("type.commentary")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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
              disabled={!value.trim() || !streamType || isMarking}
            >
              {t("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
