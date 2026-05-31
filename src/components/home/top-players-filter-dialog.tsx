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
import { useState } from "react";
import { toast } from "sonner";

/**
 * Dialog component for filtering top players.
 * Admins can add player names or profile IDs to filter them out from the top players list.
 */
export function TopPlayersFilterDialog() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");

  const utils = api.useUtils();

  const { data: filters = [], isLoading } =
    api.leaderboard.getPlayerFilters.useQuery(undefined, { enabled: open });

  const add = api.leaderboard.addPlayerFilter.useMutation({
    onSuccess: async () => {
      setInput("");
      await utils.leaderboard.getPlayerFilters.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const remove = api.leaderboard.removePlayerFilter.useMutation({
    onSuccess: async () => {
      await utils.leaderboard.getPlayerFilters.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  function handleAdd() {
    const trimmed = input.trim();

    if (!trimmed) return;

    const asNumber = Number(trimmed);

    if (!isNaN(asNumber) && Number.isInteger(asNumber) && asNumber > 0) {
      add.mutate({ profileId: asNumber });
    } else {
      add.mutate({ name: trimmed });
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
        className="max-w-sm"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>Player Filter</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            placeholder="Name or profile ID"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button
            size="icon"
            onClick={handleAdd}
            disabled={!input.trim() || add.isPending}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {!isLoading && filters.length === 0 && (
            <p className="text-muted-foreground text-sm">No filters set.</p>
          )}
          {filters.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <span>
                {f.name ?? (
                  <span className="text-muted-foreground">
                    profileId: {f.profileId}
                  </span>
                )}
              </span>

              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive h-6 w-6"
                onClick={() => remove.mutate({ id: f.id })}
                disabled={remove.isPending}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
