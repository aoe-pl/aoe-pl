"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ErrorToast } from "@/components/ui/error-toast-content";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { Check, ChevronsUpDown, Loader2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type AddParticipantDialogProps = {
  tournamentId: string;
};

export function AddParticipantDialog({
  tournamentId,
}: AddParticipantDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userPopoverOpen, setUserPopoverOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");

  const { data: users, isLoading } = api.users.list.useQuery(undefined, {
    enabled: open,
  });

  const { mutate: addParticipant, isPending } =
    api.tournaments.participants.adminAdd.useMutation({
      onSuccess: () => {
        toast.success("Participant added.");
        setOpen(false);
        setSelectedUserId(null);
        setNickname("");
        router.refresh();
      },
      onError: (error) => {
        toast.error(<ErrorToast message={error.message} />);
      },
    });

  const selectedUser = users?.find((u) => u.id === selectedUserId);

  const handleSubmit = () => {
    if (!selectedUserId) return;
    addParticipant({
      tournamentId,
      userId: selectedUserId,
      nickname: nickname.trim() || undefined,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          size="sm"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add participant
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add participant</DialogTitle>
          <DialogDescription>
            Manually register an existing user for this tournament.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>User</Label>
            <Popover
              open={userPopoverOpen}
              onOpenChange={setUserPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={userPopoverOpen}
                  className="w-full justify-between"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading users...
                    </span>
                  ) : selectedUser ? (
                    `${selectedUser.name ?? "Unnamed"} (#${selectedUser.playerNumber})`
                  ) : (
                    <span className="text-muted-foreground">
                      Select a user...
                    </span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Search by name or email..." />
                  <CommandList>
                    <CommandEmpty>No users found.</CommandEmpty>
                    <CommandGroup>
                      {users?.map((user) => (
                        <CommandItem
                          key={user.id}
                          value={`${user.name ?? ""} ${user.email ?? ""} ${user.playerNumber}`}
                          onSelect={() => {
                            setSelectedUserId(user.id);
                            setUserPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedUserId === user.id
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          <div className="flex flex-col">
                            <span>
                              {user.name ?? "Unnamed"} (#{user.playerNumber})
                            </span>
                            {user.email && (
                              <span className="text-muted-foreground text-xs">
                                {user.email}
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="participant-nickname">
              Nickname (optional, defaults to user's name)
            </Label>
            <Input
              id="participant-nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={selectedUser?.name ?? "Nickname"}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedUserId || isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
