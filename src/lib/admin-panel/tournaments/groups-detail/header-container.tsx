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
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import type {
  Tournament,
  TournamentGroup,
  TournamentGroupSubmitData,
  TournamentGroupWithParticipants,
  TournamentMatchModeType,
} from "../tournament";
import { TournamentGroupForm } from "../tournament-group-form";
import { GroupHeader } from "./group-header";

type HeaderContainerProps = {
  group: TournamentGroupWithParticipants & { tournament: Tournament };
  groups: TournamentGroup[];
  participants: {
    id: string;
    nickname: string;
    playerNumber: number | undefined;
  }[];
  matchesCount: number;
  matchMode: { id: string; mode: TournamentMatchModeType; gameCount: number };
  tournamentId: string;
};

export function HeaderContainer({
  group,
  groups,
  participants,
  tournamentId,
  matchesCount,
  matchMode,
}: HeaderContainerProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const router = useRouter();
  const t = useTranslations("admin.tournaments.groups.detail");

  const { mutate: updateGroup, isPending: updatePending } =
    api.tournaments.groups.update.useMutation({
      onSuccess: () => {
        setIsDrawerOpen(false);
        router.refresh();
        toast.success(t("update_success"));
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
        participants={participants}
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
            <DrawerTitle>{t("edit_dialog_title")}</DrawerTitle>
            <DrawerDescription>
              {t("edit_dialog_description")}
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
