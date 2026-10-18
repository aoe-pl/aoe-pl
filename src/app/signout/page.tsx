import { Button } from "@/components/ui/button";
import { signOutUser } from "@/server/auth/actions";
import { LogOut } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Wylogowanie | AoE2 - Polska",
};

export default async function SignOutPage() {
  const t = await getTranslations("auth.signout");

  return (
    <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-32">
      <div className="panel w-full max-w-md text-center">
        <div className="mb-4 flex justify-center"></div>

        <h1 className="text-medieval-gold text-2xl font-bold">{t("title")}</h1>

        <p className="text-medieval-parchment-foreground/80 mt-3 text-sm text-balance">
          {t("description")}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            variant="wood"
            className="font-semibold sm:flex-1"
          >
            <Link href="/">{t("cancel")}</Link>
          </Button>

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
        </div>
      </div>
    </div>
  );
}
