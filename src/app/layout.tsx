import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { Navigation } from "@/components/layout/navigation";
import { ThemeCustomizer } from "@/components/layout/theme-customizer";
import { auth } from "@/server/auth";
import { TRPCReactProvider } from "@/trpc/react";
import { api } from "@/trpc/server";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

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
  const session = await auth();
  const isAdmin = session ? await api.users.isAdmin() : false;

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
          <TRPCReactProvider>{children}</TRPCReactProvider>
          <ThemeCustomizer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
