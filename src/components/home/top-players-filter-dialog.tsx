"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";
import { Minus, Plus, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Dialog component for managing the top players list.
 * Admins can manually include AoE2Companion profiles that are not from Poland,
 * and can add player names or profile IDs to filter out of the list.
 */
export function TopPlayersFilterDialog() {
  const t = useTranslations("home.top_players.settings");

  const [open, setOpen] = useState(false);
  const [includedInput, setIncludedInput] = useState("");
  const [filterInput, setFilterInput] = useState("");

  const router = useRouter();
  const utils = api.useUtils();

  const { data: includedPlayers = [], isLoading: includedLoading } =
    api.leaderboard.getIncludedPlayers.useQuery(undefined, { enabled: open });

  const { data: filters = [], isLoading: filtersLoading } =
    api.leaderboard.getPlayerFilters.useQuery(undefined, { enabled: open });

  const addIncluded = api.leaderboard.addIncludedPlayer.useMutation({
    onSuccess: async () => {
      setIncludedInput("");
      await utils.leaderboard.getIncludedPlayers.invalidate();
      router.refresh();
    },
    onError: (e) => toast.error(e.message),
  });

  const removeIncluded = api.leaderboard.removeIncludedPlayer.useMutation({
    onSuccess: async () => {
      await utils.leaderboard.getIncludedPlayers.invalidate();
      router.refresh();
    },
    onError: (e) => toast.error(e.message),
  });

  const addFilter = api.leaderboard.addPlayerFilter.useMutation({
    onSuccess: async () => {
      setFilterInput("");
      await utils.leaderboard.getPlayerFilters.invalidate();
      router.refresh();
    },
    onError: (e) => toast.error(e.message),
  });

  const removeFilter = api.leaderboard.removePlayerFilter.useMutation({
    onSuccess: async () => {
      await utils.leaderboard.getPlayerFilters.invalidate();
      router.refresh();
    },
    onError: (e) => toast.error(e.message),
  });

  function handleAddIncluded() {
    const trimmed = includedInput.trim();
    const profileId = Number(trimmed);

    if (!Number.isInteger(profileId) || profileId <= 0) {
      toast.error(t("invalid_profile_id"));
      return;
    }

    addIncluded.mutate({ profileId });
  }

  function handleAddFilter() {
    const trimmed = filterInput.trim();

    if (!trimmed) return;

    const asNumber = Number(trimmed);

    if (!isNaN(asNumber) && Number.isInteger(asNumber) && asNumber > 0) {
      addFilter.mutate({ profileId: asNumber });
    } else {
      addFilter.mutate({ name: trimmed });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className="h-6 w-6"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[80vh] max-w-sm overflow-y-auto"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <section className="space-y-2">
          <div>
            <h3 className="text-sm font-semibold">{t("included_title")}</h3>
            <p className="text-muted-foreground text-xs">
              {t("included_description")}
            </p>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder={t("included_placeholder")}
              inputMode="numeric"
              value={includedInput}
              onChange={(e) => setIncludedInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddIncluded()}
            />
            <Button
              size="icon"
              onClick={handleAddIncluded}
              disabled={!includedInput.trim() || addIncluded.isPending}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {!includedLoading && includedPlayers.length === 0 && (
              <p className="text-muted-foreground text-sm">
                {t("included_empty")}
              </p>
            )}
            {includedPlayers.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <span>
                  {p.name ? (
                    <>
                      {p.name}
                      <span className="text-muted-foreground ml-2 text-xs">
                        #{p.profileId}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">
                      {t("profile_id", { id: p.profileId })}
                    </span>
                  )}
                </span>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive h-6 w-6"
                  onClick={() => removeIncluded.mutate({ id: p.id })}
                  disabled={removeIncluded.isPending}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <div>
            <h3 className="text-sm font-semibold">{t("excluded_title")}</h3>
            <p className="text-muted-foreground text-xs">
              {t("excluded_description")}
            </p>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder={t("excluded_placeholder")}
              value={filterInput}
              onChange={(e) => setFilterInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddFilter()}
            />
            <Button
              size="icon"
              onClick={handleAddFilter}
              disabled={!filterInput.trim() || addFilter.isPending}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {!filtersLoading && filters.length === 0 && (
              <p className="text-muted-foreground text-sm">
                {t("excluded_empty")}
              </p>
            )}
            {filters.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <span>
                  {f.name ?? (
                    <span className="text-muted-foreground">
                      {t("profile_id", { id: f.profileId ?? "" })}
                    </span>
                  )}
                </span>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive h-6 w-6"
                  onClick={() => removeFilter.mutate({ id: f.id })}
                  disabled={removeFilter.isPending}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
}
