"use client";

import { Button } from "@/components/ui/button";
import { Archive, ArchiveRestore } from "lucide-react";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
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
