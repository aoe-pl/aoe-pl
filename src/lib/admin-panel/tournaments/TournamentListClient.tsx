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

  const deleteMutation = api.tournaments.delete.useMutation({
    onSuccess: () => {
      toast.success(t("delete_success"));
      setOpen(false);
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
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
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate({ id: tournamentId })}
          >
            {t("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
