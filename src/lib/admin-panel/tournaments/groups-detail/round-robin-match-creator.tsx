"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ListPlus } from "lucide-react";
import { toast } from "sonner";

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
import { ErrorToast } from "@/components/ui/error-toast-content";
import {
  collectExistingPairKeys,
  filterCreatablePairs,
  generateAllPairs,
} from "@/lib/tournaments/group-match-pairs";
import { api } from "@/trpc/react";
import { useTranslations } from "next-intl";
import type { ExtendedTournamentMatch } from "./match";

export function RoundRobinMatchCreator({
  groupId,
  matches,
  participants,
}: {
  groupId: string;
  matches: ExtendedTournamentMatch[];
  participants: { id: string }[];
}) {
  const router = useRouter();
  const t = useTranslations("admin.tournaments.groups.matches");

  const missingMatchesCount = useMemo(() => {
    const memberIds = participants.map(({ id }) => id);
    const existingPairKeys = collectExistingPairKeys(
      matches.map((match) => ({
        participantIds: match.TournamentMatchParticipant.map(
          (participant) => participant.participantId,
        ),
      })),
    );

    return filterCreatablePairs(
      generateAllPairs(memberIds),
      memberIds,
      existingPairKeys,
    ).length;
  }, [participants, matches]);

  const { mutate: createRoundRobin, isPending } =
    api.tournaments.matches.createRoundRobin.useMutation({
      onSuccess: ({ created }) => {
        if (created > 0) {
          toast.success(t("generated", { count: created }));
        } else {
          toast.info(t("nothing_to_generate"));
        }

        router.refresh();
      },
      onError: (error) => {
        toast.error(<ErrorToast message={error.message} />);
      },
    });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="gold">
          <ListPlus className="mr-2 h-4 w-4" />
          {t("generate_all")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("generate_dialog_title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("generate_description", { count: missingMatchesCount })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => createRoundRobin({ groupId })}
            disabled={isPending || missingMatchesCount === 0}
          >
            {isPending
              ? t("creating")
              : t("create_count", { count: missingMatchesCount })}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
