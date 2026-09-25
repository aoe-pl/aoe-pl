"use client";

import { ErrorToast } from "@/components/ui/error-toast-content";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { tournamentFormSchema, type Tournament } from "./tournament";
import { TournamentForm } from "./tournament-form";

type TournamentFormData = z.infer<typeof tournamentFormSchema>;

export function TournamentEdit({ tournament }: { tournament: Tournament }) {
  const router = useRouter();

  const form = useForm<TournamentFormData>({
    resolver: zodResolver(tournamentFormSchema),
    defaultValues: {
      name: tournament.name,
      urlKey: tournament.urlKey,
      tournamentSeriesId: tournament.tournamentSeriesId,
      registrationMode: tournament.registrationMode,
      format: tournament.format,
      description: tournament.description ?? undefined,
      imageKey: tournament.imageKey ?? undefined,
      isTeamBased: tournament.isTeamBased,
      startDate: tournament.startDate ?? undefined,
      endDate: tournament.endDate ?? undefined,
      participantsLimit: tournament.participantsLimit ?? undefined,
      registrationStartDate: tournament.registrationStartDate ?? undefined,
      registrationEndDate: tournament.registrationEndDate ?? undefined,
      status: tournament.status,
      isVisible: tournament.isVisible,
    },
  });

  const createTournamentMutation = api.tournaments.update.useMutation({
    onSuccess: () => {
      router.push(`/admin/tournaments/view/${tournament.id}`);
    },
    onError: (error) => {
      toast.error(
        <ErrorToast
          customTitle="Failed to update tournament"
          message={error.message}
        />,
        {
          closeButton: true,
          duration: Infinity,
        },
      );
    },
  });

  const onSubmit = (data: TournamentFormData) => {
    createTournamentMutation.mutate({
      id: tournament.id,
      data,
    });
  };

  return (
    <TournamentForm
      isPending={createTournamentMutation.isPending}
      form={form}
      onSubmit={onSubmit}
      formatLocked
      bannerPreviewUrl={
        tournament.imageKey ? `/api/tournaments/${tournament.id}/banner` : null
      }
    />
  );
}
