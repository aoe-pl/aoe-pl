"use client";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ErrorToast } from "@/components/ui/error-toast-content";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type {
  Tournament,
  TournamentGroup,
  TournamentGroupSubmitData,
  TournamentGroupWithParticipants,
} from "../tournament";
import { TournamentGroupForm } from "../tournament-group-form";
import { GroupHeader } from "./group-header";

type HeaderContainerProps = {
  group: TournamentGroupWithParticipants & { tournament: Tournament };
  groups: TournamentGroup[];
  matchesCount: number;
  matchMode: { id: string; mode: string; gameCount: number };
  tournamentId: string;
};

export function HeaderContainer({
  group,
  groups,
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

  function handleUpdate(data: TournamentGroupSubmitData) {
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
        tournamentName={group.tournament.name}
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
            key={group.id}
            initialData={group}
            onSubmit={handleUpdate}
            onCancel={() => {
              setIsDrawerOpen(false);
            }}
            groups={groups}
            isPending={updatePending}
            tournamentId={tournamentId}
            defaultIsTeamBased={group.isTeamBased ?? false}
          />
        </DrawerContent>
      </Drawer>
    </>
  );
}
