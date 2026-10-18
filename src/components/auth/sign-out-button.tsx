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
import { signOutUser } from "@/server/auth/actions";
import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ComponentProps } from "react";

interface SignOutButtonProps
  extends Omit<ComponentProps<typeof Button>, "asChild"> {
  /** Set to `false` to sign out immediately instead of asking for confirmation. */
  confirm?: boolean;
}

/**
 * Signs the user out from a dialog so an accidental click can't log them out.
 */
export function SignOutButton({
  children,
  confirm = true,
  onClick,
  ...buttonProps
}: SignOutButtonProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("auth.signout");

  if (!confirm) {
    return (
      <form action={signOutUser}>
        <Button
          type="submit"
          onClick={onClick}
          {...buttonProps}
        >
          {children ?? t("confirm")}
        </Button>
      </form>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button
          onClick={onClick}
          {...buttonProps}
        >
          {children ?? t("confirm")}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="items-center text-center sm:text-center">
          <DialogTitle className="text-medieval-gold text-2xl font-bold">
            {t("title")}
          </DialogTitle>
          <DialogDescription className="text-balance">
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-2 sm:justify-center">
          <DialogClose asChild>
            <Button
              type="button"
              variant="wood"
              className="font-semibold sm:flex-1"
            >
              {t("cancel")}
            </Button>
          </DialogClose>

          <form
            action={signOutUser}
            className="sm:flex-1"
          >
            <Button
              type="submit"
              variant="wine"
              className="w-full font-semibold"
            >
              <LogOut className="size-4" />
              {t("confirm")}
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
