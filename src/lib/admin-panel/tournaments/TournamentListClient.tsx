"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/trpc/react";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface TournamentArchiveButtonProps {
  tournamentId: string;
  isArchived: boolean;
  title: string;
}

export function TournamentArchiveButton({
  tournamentId,
  isArchived,
  title,
}: TournamentArchiveButtonProps) {
  const router = useRouter();
  const archiveMutation = api.tournaments.archive.useMutation({
    onSuccess: () => {
      toast.success("Turniej został zarchiwizowany");
      router.refresh();
    },
    onError: (error) => {
      toast.error(`Błąd: ${error.message}`);
    },
  });

  const unarchiveMutation = api.tournaments.unarchive.useMutation({
    onSuccess: () => {
      toast.success("Turniej został przywrócony z archiwum");
      router.refresh();
    },
    onError: (error) => {
      toast.error(`Błąd: ${error.message}`);
    },
  });

  const handleClick = () => {
    if (isArchived) {
      unarchiveMutation.mutate({ id: tournamentId });
    } else {
      archiveMutation.mutate({ id: tournamentId });
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0"
      title={title}
      onClick={handleClick}
      disabled={archiveMutation.isPending || unarchiveMutation.isPending}
    >
      {isArchived ? (
        <ArchiveRestore className="h-4 w-4" />
      ) : (
        <Archive className="h-4 w-4" />
      )}
    </Button>
  );
}

const DELETE_CONFIRM_KEYWORD = "DELETE";

interface TournamentDeleteButtonProps {
  tournamentId: string;
  tournamentName: string;
}

export function TournamentDeleteButton({
  tournamentId,
  tournamentName,
}: TournamentDeleteButtonProps) {
  const t = useTranslations("admin.tournaments");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [keyword, setKeyword] = useState("");

  const deleteMutation = api.tournaments.delete.useMutation({
    onSuccess: () => {
      toast.success(t("delete_success"));
      setConfirmOpen(false);
      setKeyword("");
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const isKeywordValid = keyword.trim() === DELETE_CONFIRM_KEYWORD;

  // First dialog is just a heads-up; the actual deletion only happens after
  // the admin re-confirms by typing the keyword in the second dialog.
  const handleRequestDelete = () => {
    setOpen(false);
    setKeyword("");
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!isKeywordValid || deleteMutation.isPending) return;
    deleteMutation.mutate({ id: tournamentId });
  };

  return (
    <>
      <AlertDialog
        open={open}
        onOpenChange={setOpen}
      >
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive h-8 w-8 p-0"
            title={t("delete")}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete_confirm_title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete_confirm_description", { name: tournamentName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {t("delete_cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-primary"
              disabled={deleteMutation.isPending}
              onClick={handleRequestDelete}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={confirmOpen}
        onOpenChange={(nextOpen) => {
          if (deleteMutation.isPending) return;
          setConfirmOpen(nextOpen);
          if (!nextOpen) setKeyword("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("delete_final_title")}</DialogTitle>
            <DialogDescription>
              {t("delete_final_description", { name: tournamentName })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="delete-tournament-confirm">
              {t("delete_final_keyword_label", {
                keyword: DELETE_CONFIRM_KEYWORD,
              })}
            </Label>
            <Input
              id="delete-tournament-confirm"
              value={keyword}
              autoComplete="off"
              placeholder={t("delete_final_keyword_placeholder")}
              onChange={(event) => setKeyword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleConfirmDelete();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConfirmOpen(false);
                setKeyword("");
              }}
              disabled={deleteMutation.isPending}
            >
              {t("delete_cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={!isKeywordValid || deleteMutation.isPending}
            >
              {deleteMutation.isPending
                ? t("delete_final_deleting")
                : t("delete_final_confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
