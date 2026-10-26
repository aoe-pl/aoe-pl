"use client";

import { ErrorToast } from "@/components/ui/error-toast-content";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/trpc/react";
import type { AdminStreamStatus } from "@prisma/client";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const STATUS_OPTIONS: {
  value: AdminStreamStatus;
  labelKey:
    | "will_be_commentated"
    | "will_be_watched"
    | "watched"
    | "commentated"
    | "will_be_streamed_live";
}[] = [
  { value: "WILL_BE_COMMENTATED", labelKey: "will_be_commentated" },
  { value: "WILL_BE_WATCHED", labelKey: "will_be_watched" },
  { value: "WATCHED", labelKey: "watched" },
  { value: "COMMENTATED", labelKey: "commentated" },
  { value: "WILL_BE_STREAMED_LIVE", labelKey: "will_be_streamed_live" },
];

interface MatchAdminStreamPanelProps {
  matchId: string;
  status: AdminStreamStatus | null;
}

/**
 * Admin-only control to mark how a match will be covered (commentated,
 * watched or streamed). Not rendered for regular users.
 */
export function MatchAdminStreamPanel({
  matchId,
  status,
}: MatchAdminStreamPanelProps) {
  const t = useTranslations("tournament.matches.admin_stream");
  const router = useRouter();

  const { mutate, isPending } =
    api.tournaments.matches.setAdminStreamStatus.useMutation({
      onSuccess: () => {
        toast.success(t("updated_toast"));
        router.refresh();
      },
      onError: (err) => toast.error(<ErrorToast message={err.message} />),
    });

  return (
    <div className="border-medieval-wood-border space-y-2 border-t pt-4 text-sm">
      <div className="text-medieval-gold-muted">{t("title")}</div>

      <Select
        value={status ?? "NONE"}
        disabled={isPending}
        onValueChange={(next) =>
          mutate({
            matchId,
            status: next === "NONE" ? null : (next as AdminStreamStatus),
          })
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="NONE">{t("none")}</SelectItem>
          {STATUS_OPTIONS.map(({ value, labelKey }) => (
            <SelectItem
              key={value}
              value={value}
            >
              {t(labelKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
