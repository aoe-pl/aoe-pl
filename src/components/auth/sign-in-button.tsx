"use client";

import { DiscordSignInForm } from "@/components/auth/discord-sign-in-form";
import { DiscordIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, type ComponentProps } from "react";

interface SignInButtonProps
  extends Omit<ComponentProps<typeof Button>, "asChild"> {
  /** Where to land after signing in. Defaults to the current path. */
  callbackUrl?: string;
}

/**
 * Opens the sign-in dialog instead of navigating to a separate page.
 */
export function SignInButton({
  callbackUrl,
  children,
  onClick,
  ...buttonProps
}: SignInButtonProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("auth.signin");

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
          {children ?? t("trigger")}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center sm:text-center">
          <span className="bg-medieval-gold/15 text-medieval-gold ring-medieval-gold/30 mb-2 flex size-14 items-center justify-center rounded-full ring-1">
            <DiscordIcon className="size-7" />
          </span>
          <DialogTitle className="text-medieval-gold text-2xl font-bold">
            {t("title")}
          </DialogTitle>
          <DialogDescription className="text-balance">
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <DiscordSignInForm
          callbackUrl={callbackUrl ?? pathname}
          className="mt-2"
        />

        <p className="text-medieval-gold-muted text-center text-xs">
          {t("footer_note")}
        </p>
      </DialogContent>
    </Dialog>
  );
}
