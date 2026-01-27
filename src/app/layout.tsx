import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { auth } from "@/server/auth";
import { Navigation } from "@/components/layout/navigation";
import { ThemeCustomizer } from "@/components/layout/theme-customizer";

export const metadata: Metadata = {
  title: "AoE2 - Polska",
  description: "Polska społeczność gry Age of Empires II.",
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const session = await auth();

  return (
    <html
      lang={locale}
      className={`${geist.variable} dark bg-background text-foreground`}
    >
      <body>
        <Navigation session={session} />
        <NextIntlClientProvider>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </NextIntlClientProvider>
        <ThemeCustomizer />
      </body>
    </html>
  );
}
