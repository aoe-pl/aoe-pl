"use client";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorToast } from "@/components/ui/error-toast-content";
import { getDraftUrl, type DraftType } from "@/lib/aoe2cm";
import { api } from "@/trpc/react";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface DraftConfig {
  type: DraftType;
  label: string;
  draftKey: string;
  hasPreset: boolean;
}

interface MatchDraftsPanelProps {
  matchId: string;
  civDraftKey: string;
  mapDraftKey: string;
  hasCivPreset: boolean;
  hasMapPreset: boolean;
  canManage: boolean;
}

/**
 * Match drafts panel.
 */
export function MatchDraftsPanel({
  matchId,
  civDraftKey,
  mapDraftKey,
  hasCivPreset,
  hasMapPreset,
  canManage,
}: MatchDraftsPanelProps) {
  const router = useRouter();
  const t = useTranslations("tournament.matches.drafts");
  const [pending, setPending] = useState<DraftType | null>(null);

  const { mutateAsync: generateDraft } =
    api.tournaments.matches.generateDraft.useMutation();
  const { mutateAsync: clearDraft } =
    api.tournaments.matches.clearDraft.useMutation();

  // Nothing to show spectators until at least one draft has been generated.
  if (!canManage && !civDraftKey && !mapDraftKey) return null;

  const drafts: DraftConfig[] = [
    {
      type: "civ",
      label: t("civ"),
      draftKey: civDraftKey,
      hasPreset: hasCivPreset,
    },
    {
      type: "map",
      label: t("map"),
      draftKey: mapDraftKey,
      hasPreset: hasMapPreset,
    },
  ];

  const handleGenerate = async (type: DraftType) => {
    setPending(type);
    try {
      await generateDraft({ matchId, type });
      toast.success(t("generated_toast"));
      router.refresh();
    } catch (error) {
      toast.error(
        <ErrorToast
          message={error instanceof Error ? error.message : t("generate_error")}
        />,
      );
    } finally {
      setPending(null);
    }
  };

  const handleClear = async (type: DraftType) => {
    setPending(type);
    try {
      await clearDraft({ matchId, type });
      toast.success(t("cleared_toast"));
      router.refresh();
    } catch (error) {
      toast.error(
        <ErrorToast
          message={error instanceof Error ? error.message : t("clear_error")}
        />,
      );
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="space-y-2 border-t border-[color:var(--medieval-wood-border)] pt-4 text-sm">
      <div className="text-[color:var(--medieval-gold-muted)]">
        {t("title")}
      </div>

      {drafts.map((draft) => {
        const isPending = pending === draft.type;
        const isGenerated = Boolean(draft.draftKey);

        // Spectators only see drafts that have already been generated.
        if (!isGenerated && !canManage) return null;

        return (
          <div
            key={draft.type}
            className="space-y-1"
          >
            <div className="flex items-center gap-2">
              {isGenerated ? (
                <Button
                  asChild
                  size="sm"
                  variant="gold"
                  className="h-8 flex-1"
                >
                  <a
                    href={getDraftUrl(draft.draftKey)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink />
                    {draft.label}
                  </a>
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="gold"
                  className="h-8 flex-1"
                  disabled={isPending || !draft.hasPreset}
                  onClick={() => void handleGenerate(draft.type)}
                >
                  <Plus />
                  {isPending
                    ? t("working")
                    : t("generate", { draft: draft.label })}
                </Button>
              )}

              {isGenerated && canManage && (
                <ConfirmDialog
                  trigger={
                    <Button
                      size="sm"
                      variant="wine"
                      className="h-8 w-8 shrink-0 p-0"
                      aria-label={t("clear")}
                      title={t("clear")}
                      disabled={isPending}
                    >
                      <Trash2 />
                    </Button>
                  }
                  title={t("clear_confirm_title")}
                  description={t("clear_confirm_description")}
                  cancelLabel={t("cancel")}
                  confirmLabel={t("clear")}
                  onConfirm={() => void handleClear(draft.type)}
                />
              )}
            </div>

            {canManage && !isGenerated && !draft.hasPreset && (
              <p className="text-xs text-[color:var(--medieval-gold-muted)]">
                {t("no_preset")}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
