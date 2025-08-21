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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const createStreamerSchema = z.object({
  userId: z.string().optional(),
  streamerName: z.string().min(1, "Streamer name is required"),
  streamerUrl: z.string().url("Please enter a valid URL"),
});

type CreateStreamerForm = z.infer<typeof createStreamerSchema>;

interface CreateStreamerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateStreamerDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateStreamerDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: availableUsers } = api.streamers.availableUsers.useQuery();

  const form = useForm<CreateStreamerForm>({
    resolver: zodResolver(createStreamerSchema),
    defaultValues: {
      userId: undefined,
      streamerName: "",
      streamerUrl: "",
    },
  });

  const createStreamerMutation = api.streamers.create.useMutation({
    onSuccess: () => {
      toast.success("Streamer created successfully");
      form.reset();
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create streamer");
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (data: CreateStreamerForm) => {
    setIsSubmitting(true);
    await createStreamerMutation.mutateAsync(data);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Streamer</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User (Optional)</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === "none" ? undefined : value)
                    }
                    defaultValue={field.value ?? "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No user selected</SelectItem>
                      {availableUsers?.map((user) => (
                        <SelectItem
                          key={user.id}
                          value={user.id}
                        >
                          {user.name ?? user.email ?? "No name"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                {isSubmitting ? "Creating..." : "Create Streamer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
