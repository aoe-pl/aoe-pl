"use client";

import { useState, useEffect } from "react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ErrorToast } from "@/components/ui/error-toast-content";
import { Accordion } from "@/components/ui/accordion";
import { specialTournamentSectionSlugs } from "@/lib/tournaments/section-constants";
import type { SectionWithTranslations } from "./sections/tournament-section-types";
import { TournamentSectionCard } from "./sections/tournament-section-card";
import { TournamentSpecialSectionCard } from "./sections/tournament-special-section-card";
import { TournamentSpecialSectionDialog } from "./sections/tournament-special-section-dialog";
import { TournamentSectionDialog } from "./sections/tournament-section-dialog";

export function TournamentSections({ tournamentId }: { tournamentId: string }) {
  const t = useTranslations("admin.tournaments.sections");

  const {
    data: sections,
    isLoading,
    refetch,
  } = api.tournaments.sections.list.useQuery({ tournamentId });

  const [ordered, setOrdered] = useState<SectionWithTranslations[]>([]);

  useEffect(() => {
    if (sections) setOrdered(sections);
  }, [sections]);

  const { mutate: reorder, isPending: reorderPending } =
    api.tournaments.sections.reorder.useMutation({
      onError: (error) => {
        toast.error(<ErrorToast message={error.message} />);
        void refetch();
      },
    });

  const { mutate: createPredefined, isPending: predefinedPending } =
    api.tournaments.sections.createPredefined.useMutation({
      onSuccess: (created) => {
        toast.success(t("toast.predefined_created", { count: created.length }));
        void refetch();
      },
      onError: (error) => toast.error(<ErrorToast message={error.message} />),
    });

  function moveSection(index: number, direction: "up" | "down") {
    const next = [...ordered];
    const swapWith = direction === "up" ? index - 1 : index + 1;

    [next[index], next[swapWith]] = [next[swapWith]!, next[index]!];

    const updated = next.map((s, i) => ({ ...s, displayOrder: i }));

    setOrdered(updated);
    reorder({
      updates: updated.map((s) => ({ id: s.id, displayOrder: s.displayOrder })),
    });
  }

  if (isLoading) return <div>{t("loading")}</div>;

  const hasSections = ordered.length > 0;
  const existingSlugs = new Set(ordered.map((s) => s.slug));

  return (
    <div className="space-y-6 py-4">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={predefinedPending}
          onClick={() =>
            createPredefined({
              tournamentId,
            })
          }
        >
          {t("create_predefined")}
        </Button>
        <TournamentSpecialSectionDialog
          tournamentId={tournamentId}
          existingSlugs={existingSlugs}
          onCreated={() => void refetch()}
        />
        <TournamentSectionDialog
          tournamentId={tournamentId}
          existingSlugs={existingSlugs}
          onCreated={() => void refetch()}
        />
      </div>

      {!hasSections && (
        <p className="text-muted-foreground text-sm">{t("no_sections")}</p>
      )}

      {hasSections && (
        <Accordion type="multiple">
          {ordered.map((section, index) => {
            const Card = specialTournamentSectionSlugs.has(section.slug)
              ? TournamentSpecialSectionCard
              : TournamentSectionCard;

            return (
              <Card
                key={section.id}
                section={section}
                isFirst={index === 1}
                isLast={index === ordered.length - 1}
                movePending={reorderPending}
                onMoveUp={() => moveSection(index, "up")}
                onMoveDown={() => moveSection(index, "down")}
                onSaved={() => void refetch()}
              />
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
