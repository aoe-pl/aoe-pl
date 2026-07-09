import "@/styles/globals.css";

import { Navigation } from "@/components/layout/navigation";
import { ThemeCustomizer } from "@/components/layout/theme-customizer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getIsAdmin, getSession } from "@/lib/session";
import { TRPCReactProvider } from "@/trpc/react";
import { type Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Geist } from "next/font/google";

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
  const messages = await getMessages();
  const session = await getSession();
  const isAdmin = session ? await getIsAdmin() : false;

  return (
    <html
      lang={locale}
      className={`${geist.variable} dark bg-background text-foreground`}
    >
      <body>
        <NextIntlClientProvider messages={messages}>
          <Navigation
            session={session}
            isAdmin={isAdmin}
          />

          <TRPCReactProvider>
            <TooltipProvider> {children} </TooltipProvider>
          </TRPCReactProvider>

          <ThemeCustomizer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
