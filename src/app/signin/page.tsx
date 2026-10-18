import { DiscordSignInForm } from "@/components/auth/discord-sign-in-form";
import { safeRedirectPath } from "@/lib/helpers/redirect";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Zaloguj się | AoE2 - Polska",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;
  const t = await getTranslations("auth.signin");

  return (
    <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-32">
      <div className="panel w-full max-w-md text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex size-20 items-center justify-center overflow-hidden rounded-xl shadow-lg">
            <Image
              src="/logo.png"
              alt="AoE2 Polska"
              width={96}
              height={96}
              className="object-contain"
            />
          </div>
        </div>

        <h1 className="text-medieval-gold text-3xl font-bold drop-shadow-lg">
          {t("title")}
        </h1>

        <div className="mt-4 mb-6 flex items-center justify-center gap-3">
          <div className="via-medieval-gold/60 h-px w-12 bg-gradient-to-r from-transparent to-transparent" />
          <span className="text-medieval-gold-muted text-xs font-semibold tracking-widest uppercase">
            AoE2 Polska
          </span>
          <div className="via-medieval-gold/60 h-px w-12 bg-gradient-to-r from-transparent to-transparent" />
        </div>

        <p className="text-medieval-parchment-foreground/80 text-sm text-balance">
          {t("description")}
        </p>

        {error && (
          <p className="mt-4 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {t("error")}
          </p>
        )}

        <DiscordSignInForm
          callbackUrl={safeRedirectPath(callbackUrl)}
          className="mt-6"
        />

        <p className="text-medieval-gold-muted mt-4 text-xs">
          {t("footer_note")}
        </p>

        <div className="border-medieval-wood-border mt-6 border-t pt-4">
          <Link
            href="/"
            className="text-medieval-gold-muted hover:text-medieval-gold text-sm font-medium transition-colors"
          >
            {t("back_home")}
          </Link>
        </div>
      </div>
    </div>
  );
}
