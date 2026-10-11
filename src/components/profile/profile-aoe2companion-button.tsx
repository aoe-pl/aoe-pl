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
import { toAbsoluteUrl } from "@/lib/utils";
import { api } from "@/trpc/react";
import { ExternalLink, Link2, Pencil, Unlink } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface ProfileAoe2CompanionButtonProps {
  userId: string;
  currentUrl: string | null;
  isEditable: boolean;
}

/**
 * Shows the linked AoE2Companion profile as a clickable link. The profile owner
 * (or an admin) can open a dialog to set, change or remove the link. When no
 * link is set, only the owner/admin sees the "link profile" action.
 */
export function ProfileAoe2CompanionButton({
  userId,
  currentUrl,
  isEditable,
}: ProfileAoe2CompanionButtonProps) {
  const t = useTranslations("profile.aoe2companion");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentUrl ?? "");

  const isLinked = Boolean(currentUrl);
  const linkHref = toAbsoluteUrl(currentUrl);

  const { mutate, isPending } = api.users.updateAoe2CompanionUrl.useMutation({
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

  // Without a link there is nothing to show to visitors.
  if (!isLinked && !isEditable) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {linkHref && (
        <a
          href={linkHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
          style={{ color: "var(--medieval-gold)" }}
        >
          <ExternalLink className="h-4 w-4" />
          {t("link_label")}
        </a>
      )}

      {isEditable && (
        <Dialog
          open={open}
          onOpenChange={handleOpenChange}
        >
          <DialogTrigger asChild>
            {isLinked ? (
              <Button
                variant="ghost"
                size="sm"
                aria-label={t("dialog_title")}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="gold"
                size="sm"
              >
                <Link2 className="h-4 w-4" />
                {t("not_linked_button")}
              </Button>
            )}
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
      )}
    </div>
  );
}
