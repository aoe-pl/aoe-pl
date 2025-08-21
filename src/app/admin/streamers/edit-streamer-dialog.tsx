"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const editStreamerSchema = z.object({
  streamerName: z.string().min(1, "Streamer name is required"),
  streamerUrl: z.string().url("Please enter a valid URL"),
});

type EditStreamerForm = z.infer<typeof editStreamerSchema>;

type Streamer = {
  id: string;
  streamerName: string;
  streamerUrl: string;
  isActive: boolean;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
};

interface EditStreamerDialogProps {
  streamer: Streamer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditStreamerDialog({
  streamer,
  open,
  onOpenChange,
  onSuccess,
}: EditStreamerDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditStreamerForm>({
    resolver: zodResolver(editStreamerSchema),
    defaultValues: {
      streamerName: streamer.streamerName,
      streamerUrl: streamer.streamerUrl,
    },
  });

  const updateStreamerMutation = api.streamers.update.useMutation({
    onSuccess: () => {
      toast.success("Streamer updated successfully");
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update streamer");
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (data: EditStreamerForm) => {
    setIsSubmitting(true);
    await updateStreamerMutation.mutateAsync({
      id: streamer.id,
      ...data,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Streamer</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <div className="bg-muted mb-4 rounded-lg p-3">
              <div className="text-sm font-medium">User</div>
              <div className="text-muted-foreground text-sm">
                {streamer.user
                  ? (streamer.user.name ?? streamer.user.email ?? "No name")
                  : "No user assigned"}
              </div>
            </div>
            <FormField
              control={form.control}
              name="streamerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Streamer Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter streamer name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="streamerUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Streamer URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://twitch.tv/username"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Update Streamer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
