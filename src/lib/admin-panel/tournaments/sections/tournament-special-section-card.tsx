"use client";

import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ErrorToast } from "@/components/ui/error-toast-content";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowUp, Eye, EyeOff } from "lucide-react";
import { type SectionRowProps } from "./tournament-section-types";
import { TournamentSectionDeleteButton } from "./tournament-section-delete-button";

export function TournamentSpecialSectionCard({
  section,
  isFirst,
  isLast,
  movePending,
  onMoveUp,
  onMoveDown,
  onSaved,
}: SectionRowProps) {
  const t = useTranslations("admin.tournaments.sections");
  const displayTitle = t(`predefined_titles.${section.slug}`);

  const { mutate: deleteSection, isPending: deletePending } =
    api.tournaments.sections.delete.useMutation({
      onSuccess: () => {
        toast.success(t("toast.removed", { name: displayTitle }));
        onSaved();
      },
      onError: (error) => toast.error(<ErrorToast message={error.message} />),
    });

  const { mutate: setVisible, isPending: visibilityPending } =
    api.tournaments.sections.update.useMutation({
      onSuccess: () => onSaved(),
      onError: (error) => toast.error(<ErrorToast message={error.message} />),
    });

  const isPending = deletePending || visibilityPending;

  return (
    <div className="bg-primary-foreground mb-3 flex items-center gap-2 rounded-lg border px-4 py-3">
      <span className="flex-1 font-medium">{displayTitle}</span>
      <Badge
        variant="secondary"
        className="shrink-0"
      >
        {t("special_badge")}
      </Badge>
      <div className="text-muted-foreground shrink-0">/{section.slug}</div>
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          disabled={isFirst || movePending || isPending}
          onClick={onMoveUp}
        >
          <ArrowUp />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          disabled={isLast || movePending || isPending}
          onClick={onMoveDown}
        >
          <ArrowDown />
        </Button>
      </div>

      <Button
        variant="ghost"
        size="icon"
        disabled={isPending}
        onClick={() =>
          setVisible({ id: section.id, isVisible: !section.isVisible })
        }
      >
        {section.isVisible ? <Eye /> : <EyeOff />}
      </Button>

      <TournamentSectionDeleteButton
        name={displayTitle}
        disabled={isPending}
        onConfirm={() => deleteSection({ id: section.id })}
      />
    </div>
  );
}
