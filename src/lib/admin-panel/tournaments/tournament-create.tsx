"use client";

import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import {
  RegistrationMode,
  tournamentFormSchema,
  TournamentStatus,
} from "./tournament";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useRouter } from "next/navigation";
import { TournamentForm } from "./tournament-form";

type TournamentFormData = z.infer<typeof tournamentFormSchema>;

export function TournamentCreate() {
  const router = useRouter();

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
    },
  });

  // tRPC mutation for creating tournament
  const createTournamentMutation = api.tournaments.create.useMutation({
    onSuccess: () => {
      router.push(`/admin/tournaments`);
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
