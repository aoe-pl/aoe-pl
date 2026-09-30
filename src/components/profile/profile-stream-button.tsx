"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ErrorToast } from "@/components/ui/error-toast-content";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";
import { Check, Link2, Unlink } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface ProfileStreamButtonProps {
  userId: string;
  currentUrl: string | null;
  isEditable: boolean;
}

/**
 * Compact button that shows whether a stream link is set on the profile.
 * The profile owner (or an admin) can open a dialog to set or remove it.
 */
export function ProfileStreamButton({
  userId,
  currentUrl,
  isEditable,
}: ProfileStreamButtonProps) {
  const t = useTranslations("profile.streams");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentUrl ?? "");

  const isLinked = Boolean(currentUrl);

  const { mutate, isPending } = api.users.updateStreamUrl.useMutation({
    onSuccess: (_data, variables) => {
      toast.success(variables?.url ? t("save_success") : t("unlink_success"));
      setOpen(false);
      router.refresh();
    },
    onError: (err) => toast.error(<ErrorToast message={err.message} />),
  });

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    setValue(currentUrl ?? "");
  };

  // Visitors only get a read-only indicator of the link status.
  if (!isEditable) {
    return (
      <span className="text-muted-foreground inline-flex items-center gap-2 text-sm">
        {isLinked ? (
          <>
            <Check
              className="h-4 w-4"
              style={{ color: "var(--medieval-gold)" }}
            />
            {t("linked")}
          </>
        ) : (
          <>
            <Unlink className="h-4 w-4" />
            {t("not_linked")}
          </>
        )}
      </span>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger asChild>
        <Button
          variant={isLinked ? "wood" : "gold"}
          size="sm"
        >
          {isLinked ? (
            <Check className="h-4 w-4" />
          ) : (
            <Link2 className="h-4 w-4" />
          )}
          {isLinked ? t("linked_button") : t("not_linked_button")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dialog_title")}</DialogTitle>
          <DialogDescription>{t("dialog_description")}</DialogDescription>
        </DialogHeader>

        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("placeholder")}
          autoFocus
        />

        <DialogFooter>
          {isLinked && (
            <Button
              variant="destructive"
              onClick={() => mutate({ userId, url: "" })}
              disabled={isPending}
            >
              <Unlink className="h-4 w-4" />
              {t("unlink")}
            </Button>
          )}
          <DialogClose asChild>
            <Button
              variant="ghost"
              disabled={isPending}
            >
              {t("cancel")}
            </Button>
          </DialogClose>
          <Button
            onClick={() => mutate({ userId, url: value.trim() })}
            disabled={isPending}
          >
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
