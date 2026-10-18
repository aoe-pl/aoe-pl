"use client";

import { DiscordIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { safeRedirectPath } from "@/lib/helpers/redirect";
import { signInWithDiscord } from "@/server/auth/actions";
import { useTranslations } from "next-intl";
import { useFormStatus } from "react-dom";

interface DiscordSignInFormProps {
  /** Where to land after a successful sign in. Defaults to the home page. */
  callbackUrl?: string;
  className?: string;
  size?: "default" | "lg";
  label?: string;
}

/**
 * The single "Sign in with Discord" call to action, shared by the sign-in page
 * and the sign-in dialog.
 */
export function DiscordSignInForm({
  callbackUrl,
  className,
  size = "lg",
  label,
}: DiscordSignInFormProps) {
  const t = useTranslations("auth.signin");

  // Binding the argument on the server action keeps the form usable without JS.
  const signIn = signInWithDiscord.bind(null, safeRedirectPath(callbackUrl));

  return (
    <form
      action={signIn}
      className={className}
    >
      <DiscordSubmitButton
        label={label ?? t("discord_button")}
        size={size}
      />
    </form>
  );
}

function DiscordSubmitButton({
  label,
  size,
}: {
  label: string;
  size: "default" | "lg";
}) {
  const t = useTranslations("auth.signin");
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="gold"
      size={size}
      disabled={pending}
      className="w-full gap-2 font-bold tracking-wide"
    >
      <DiscordIcon className="size-5" />
      {pending ? t("redirecting") : label}
    </Button>
  );
}
