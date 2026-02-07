"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui";
import type { Session } from "next-auth";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface NavigationProps {
  session: Session | null;
  isAdmin: boolean;
}

interface NavLinkProps {
  label: string;
  href: string;
}

export function Navigation({ session, isAdmin }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = useTranslations("navigation");

  const navItems = [
    { label: t("home"), href: "/" },
    { label: t("news"), href: "/news" },
    { label: t("tournaments"), href: "#" },
  ];

  return (
    <nav className="from-background/95 to-background/70 border-primary/20 fixed top-0 z-50 w-full border-b bg-gradient-to-b shadow-lg backdrop-blur-lg">
      <div className="mx-auto max-w-6xl px-4 py-5">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="group flex items-center gap-3"
          >
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg shadow-lg">
              <Image
                src="/logo.png"
                alt="AoE2 Polska Logo"
                width={64}
                height={64}
                className="object-contain"
              />
            </div>

            <div className="flex flex-col">
              <span className="text-accent text-xl font-bold sm:inline">
                {t("site_name")}
              </span>
            </div>
          </Link>

          <DesktopNavigation
            navItems={navItems}
            isAdmin={isAdmin}
            session={session}
            t={t}
          />

          <MobileMenuButton
            isOpen={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          />
        </div>

        <MobileMenu
          isOpen={mobileMenuOpen}
          navItems={navItems}
          isAdmin={isAdmin}
          session={session}
          t={t}
          onClose={() => setMobileMenuOpen(false)}
        />
      </div>
    </nav>
  );
}

function DesktopNavigation({
  navItems,
  isAdmin,
  session,
  t,
}: {
  navItems: NavLinkProps[];
  isAdmin: boolean;
  session: Session | null;
  t: (key: string) => string;
}) {
  const navLinkClass =
    "text-foreground/80 hover:text-accent group relative px-4 py-2 text-sm font-semibold transition-colors";
  const underlineClass =
    "from-primary to-accent absolute bottom-1 left-0 h-0.5 w-0 bg-gradient-to-r transition-all duration-300 group-hover:w-full";

  return (
    <div className="hidden items-center gap-1 md:flex md:gap-2">
      {navItems.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={navLinkClass}
        >
          {item.label}
          <div className={underlineClass} />
        </Link>
      ))}

      {isAdmin && (
        <Link
          href="/admin"
          className={navLinkClass}
        >
          {t("admin")}
          <div className={underlineClass} />
        </Link>
      )}

      {session && (
        <span className="text-foreground/70 ml-2 hidden text-sm lg:inline">
          {t("logged_in_as")}{" "}
          <span className="text-accent font-semibold">
            {session.user?.name}
          </span>
        </span>
      )}

      <Button
        asChild
        className="text-primary-foreground ml-4 font-semibold shadow-lg"
      >
        <Link href={session ? "/api/auth/signout" : "/api/auth/signin"}>
          {session ? t("logout") : t("login")}
        </Link>
      </Button>
    </div>
  );
}

function MobileMenuButton({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-foreground hover:text-accent p-2 transition-colors md:hidden"
    >
      {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
    </button>
  );
}

function MobileMenu({
  isOpen,
  navItems,
  isAdmin,
  session,
  t,
  onClose,
}: {
  isOpen: boolean;
  navItems: NavLinkProps[];
  isAdmin: boolean;
  session: Session | null;
  t: (key: string) => string;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="border-primary/10 mt-4 border-t pt-4 md:hidden">
      <div className="flex flex-col space-y-3">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="text-foreground/80 hover:text-accent hover:bg-accent/10 rounded-md px-4 py-2 text-base font-semibold transition-colors"
            onClick={onClose}
          >
            {item.label}
          </Link>
        ))}

        {isAdmin && (
          <Link
            href="/admin"
            className="text-foreground/80 hover:text-accent hover:bg-accent/10 rounded-md px-4 py-2 text-base font-semibold transition-colors"
            onClick={onClose}
          >
            {t("admin")}
          </Link>
        )}

        {session && (
          <div className="text-foreground/70 px-4 py-2 text-sm">
            {t("logged_in_as")}{" "}
            <span className="text-accent font-semibold">
              {session.user?.name}
            </span>
          </div>
        )}

        <Button
          asChild
          className="text-primary-foreground bg-primary mx-4 font-semibold"
        >
          <Link
            href={session ? "/api/auth/signout" : "/api/auth/signin"}
            onClick={onClose}
          >
            {session ? t("logout") : t("login")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
