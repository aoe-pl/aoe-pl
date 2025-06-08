"use client";

import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import {
  RegistrationMode,
  tournamentFormSchema,
  TournamentStageType,
  TournamentStatus,
} from "./tournament";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { TournamentForm } from "./tournament-form";

type TournamentFormData = z.infer<typeof tournamentFormSchema>;

export function TournamentCreate() {
  const form = useForm<TournamentFormData>({
    resolver: zodResolver(tournamentFormSchema),
    defaultValues: {
      name: "",
      urlKey: "",
      tournamentSeriesId: "",
      matchModeId: "",
      registrationMode: RegistrationMode.INDIVIDUAL,
      description: "",
      isTeamBased: false,
      startDate: undefined,
      endDate: undefined,
      participantsLimit: undefined,
      registrationStartDate: undefined,
      registrationEndDate: undefined,
      status: TournamentStatus.PENDING,
      isVisible: false,
      stages: [
        {
          name: "Group Stage",
          type: TournamentStageType.GROUP,
          isActive: true,
          description: "Standard group stage",
          isSeeded: true,
        },
      ],
    },
  });

  // tRPC mutation for creating tournament
  const createTournamentMutation = api.tournaments.create.useMutation({
    onSuccess: () => {
      toast.success("Tournament created successfully!");
      // Reset form after successful creation
      form.reset();
    },
    onError: (error) => {
      toast.error(`Failed to create tournament: ${error.message}`);
    },
  });

  const onSubmit = (data: TournamentFormData) => {
    createTournamentMutation.mutate(data);
  };

  return (
    <TournamentForm
      isPending={createTournamentMutation.isPending}
      form={form}
      onSubmit={onSubmit}
    />
  );
}
