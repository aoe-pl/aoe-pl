"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface RegistrationPanelProps {
  tournamentId: string;
  isLoggedIn: boolean;
  isAlreadyRegistered: boolean;
}

export function RegistrationPanel({
  tournamentId,
  isLoggedIn,
  isAlreadyRegistered,
}: RegistrationPanelProps) {
  const t = useTranslations("tournaments.registration");
  const [registered, setRegistered] = useState(false);

  const { mutate: register, isPending } =
    api.tournaments.participants.register.useMutation({
      onSuccess: () => setRegistered(true),
    });

  if (!isLoggedIn) {
    return (
      <div className="flex items-center gap-4 rounded-md">
        {t("must_be_logged_in")}
      </div>
    );
  }

  if (isAlreadyRegistered) {
    return (
      <div className="flex items-center gap-4 rounded-md">
        {t("already_registered")}
      </div>
    );
  }

  if (registered) {
    return (
      <div className="flex items-center gap-4 rounded-md">
        {t("register_success")}
      </div>
    );
  }

  return (
    <Button
      onClick={() => register({ tournamentId })}
      disabled={isPending}
    >
      {isPending ? t("registering") : t("register")}
    </Button>
  );
}
