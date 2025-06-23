"use client";

import { useState } from "react";
import { GroupHeader } from "./group-header";
import type {
  TournamentGroupFormSchema,
  TournamentGroupWithParticipants,
} from "../tournament";
import {
  Drawer,
  DrawerTitle,
  DrawerContent,
  DrawerHeader,
  DrawerDescription,
} from "@/components/ui/drawer";
import { TournamentGroupForm } from "../tournament-group-form";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { ErrorToast } from "@/components/ui/error-toast-content";
import { useRouter } from "next/navigation";

type HeaderContainerProps = {
  group: TournamentGroupWithParticipants;
  matchesCount: number;
  matchMode: { id: string; mode: string; gameCount: number };
  tournamentId: string;
};

export function HeaderContainer({
  group,
  tournamentId,
  matchesCount,
  matchMode,
}: HeaderContainerProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const router = useRouter();

  const { mutate: updateGroup, isPending: updatePending } =
    api.tournaments.groups.update.useMutation({
      onSuccess: () => {
        setIsDrawerOpen(false);
        router.refresh();
        toast.success("Group updated successfully");
      },
      onError: (error) => {
        toast.error(<ErrorToast message={error.message} />, {
          duration: Infinity,
          closeButton: true,
        });
      },
    });

  function handleUpdate(data: TournamentGroupFormSchema) {
    updateGroup({
      id: group.id,
      data,
    });
  }

  return (
    <>
      <GroupHeader
        name={group.name}
        isTeamBased={group.isTeamBased ?? false}
        isMixed={group.isMixed ?? false}
        participantsCount={group.TournamentGroupParticipant.length}
        matchesCount={matchesCount}
        matchMode={matchMode}
        onEdit={() => setIsDrawerOpen(true)}
      />
      <Drawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Edit Group</DrawerTitle>
            <DrawerDescription>
              Update the group details below.
            </DrawerDescription>
          </DrawerHeader>
          <TournamentGroupForm
            initialData={group}
            onSubmit={handleUpdate}
            onCancel={() => {
              setIsDrawerOpen(false);
            }}
            isPending={updatePending}
            tournamentId={tournamentId}
            defaultIsTeamBased={group.isTeamBased ?? false}
            defaultMatchModeId={matchMode.id}
          />
        </DrawerContent>
      </Drawer>
    </>
  );
}
