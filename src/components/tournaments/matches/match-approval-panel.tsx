"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { CheckCircle2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

interface MatchApprovalPanelProps {
  matchId: string;
  isApproved: boolean;
}

/**
 * Admin-only control for approving a match result (or revoking an approval).
 */
export function MatchApprovalPanel({
  matchId,
  isApproved,
}: MatchApprovalPanelProps) {
  const router = useRouter();
  const t = useTranslations("tournament.matches");

  const { mutate: setApproval, isPending } =
    api.tournaments.matches.setApproval.useMutation({
      onSuccess: () => router.refresh(),
    });

  return (
    <div className="space-y-2 border-t border-[color:var(--medieval-wood-border)] pt-4 text-sm">
      <div className="text-[color:var(--medieval-gold-muted)]">
        {t("approval.title")}
      </div>

      <Button
        size="lg"
        variant={isApproved ? "wine" : "gold"}
        className="w-full"
        disabled={isPending}
        onClick={() => setApproval({ matchId, approved: !isApproved })}
      >
        {isApproved ? <XCircle /> : <CheckCircle2 />}
        {t(
          isApproved ? "approval.unapprove_button" : "approval.approve_button",
        )}
      </Button>
    </div>
  );
}
