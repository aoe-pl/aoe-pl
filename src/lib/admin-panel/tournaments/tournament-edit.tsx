"use client";

import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import {
  tournamentFormSchema,
  type Tournament,
  type TournamentStage,
} from "./tournament";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useRouter } from "next/navigation";
import { TournamentForm } from "./tournament-form";
import React from "react";
import { ErrorToast } from "@/components/ui/error-toast-content";

type TournamentFormData = z.infer<typeof tournamentFormSchema>;

export type TournamentWithStages = Tournament & { stages: TournamentStage[] };

export function TournamentEdit({
  tournament,
}: {
  tournament: TournamentWithStages;
}) {
  const router = useRouter();

  const form = useForm<TournamentFormData>({
    resolver: zodResolver(tournamentFormSchema),
    defaultValues: {
      name: tournament.name,
      urlKey: tournament.urlKey,
      tournamentSeriesId: tournament.tournamentSeriesId,
      matchModeId: tournament.matchModeId,
      registrationMode: tournament.registrationMode,
      description: tournament.description,
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
    />
  );
}
