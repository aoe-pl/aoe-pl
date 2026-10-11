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
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface ProfileNameEditorProps {
  currentName: string | null;
}

/**
 * Lets the profile owner change their global display name, which is used
 * across all tournaments. The parent only renders this on the user's own
 * profile, so visitors never see it.
 */
export function ProfileNameEditor({ currentName }: ProfileNameEditorProps) {
  const t = useTranslations("profile.name");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentName ?? "");

  const { mutate, isPending } = api.users.updateOwnName.useMutation({
    onSuccess: () => {
      toast.success(t("save_success"));
      setOpen(false);
      router.refresh();
    },
    onError: (err) => toast.error(<ErrorToast message={err.message} />),
  });

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    setValue(currentName ?? "");
  };

  const trimmed = value.trim();

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={t("edit")}
        >
          <Pencil className="h-3.5 w-3.5" />
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
          maxLength={32}
          autoFocus
        />

        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant="ghost"
              disabled={isPending}
            >
              {t("cancel")}
            </Button>
          </DialogClose>
          <Button
            onClick={() => mutate({ name: trimmed })}
            disabled={isPending || trimmed.length === 0}
          >
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
