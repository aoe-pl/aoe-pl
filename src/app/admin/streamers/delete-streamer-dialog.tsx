"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type Streamer = {
  id: string;
  streamerName: string;
  streamerUrl: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
};

interface DeleteStreamerDialogProps {
  streamer: Streamer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteStreamerDialog({
  streamer,
  open,
  onOpenChange,
  onSuccess,
}: DeleteStreamerDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteStreamerMutation = api.streamers.delete.useMutation({
    onSuccess: () => {
      toast.success("Streamer deleted successfully");
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete streamer");
    },
    onSettled: () => {
      setIsDeleting(false);
    },
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteStreamerMutation.mutateAsync({ id: streamer.id });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Streamer</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this streamer? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-muted mb-4 rounded-lg p-4">
          <div className="font-medium">{streamer.streamerName}</div>
          <div className="text-muted-foreground text-sm">
            User:{" "}
            {streamer.user
              ? (streamer.user.name ?? streamer.user.email ?? "No name")
              : "No user assigned"}
          </div>
          <div className="text-muted-foreground text-sm">
            URL: {streamer.streamerUrl}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
