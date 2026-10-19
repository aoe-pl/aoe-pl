"use client";

import { SignInButton } from "@/components/auth/sign-in-button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import {
  TournamentsMobileMenu,
  TournamentsNavLink,
} from "@/components/layout/tournaments-nav-link";
import type { TournamentNavGroup } from "@/lib/helpers/tournament-nav";
import { Menu, X } from "lucide-react";
import type { Session } from "next-auth";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface NavigationProps {
  session: Session | null;
  isAdmin: boolean;
  tournamentGroups: TournamentNavGroup[];
}

interface NavLinkProps {
  label: string;
  href: string;
}

export function Navigation({
  session,
  isAdmin,
  tournamentGroups,
}: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = useTranslations("navigation");

  const navItems = [
    { label: t("home"), href: "/" },
    { label: t("news"), href: "/news" },
    { label: t("tournaments"), href: "/tournaments" },
  ];

  return (
    <nav className="from-background/95 to-background/80 border-primary/20 fixed top-0 z-50 w-full border-b bg-gradient-to-b shadow-lg backdrop-blur-lg">
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
            tournamentGroups={tournamentGroups}
            hallOfFameLabel={t("hall_of_fame")}
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
          tournamentGroups={tournamentGroups}
          hallOfFameLabel={t("hall_of_fame")}
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
  tournamentGroups,
  hallOfFameLabel,
  t,
}: {
  navItems: NavLinkProps[];
  isAdmin: boolean;
  session: Session | null;
  tournamentGroups: TournamentNavGroup[];
  hallOfFameLabel: string;
  t: (key: string) => string;
}) {
  const navLinkClass =
    "text-accent hover:text-foreground group relative px-4 py-2 text-sm font-semibold transition-colors";

  return (
    <div className="hidden items-center gap-1 md:flex md:gap-2">
      {navItems.map((item) =>
        item.href === "/tournaments" ? (
          <TournamentsNavLink
            key={item.label}
            groups={tournamentGroups}
            label={item.label}
            hallOfFameLabel={hallOfFameLabel}
            className={navLinkClass}
          />
        ) : (
          <Link
            key={item.label}
            href={item.href}
            className={navLinkClass}
          >
            {item.label}
          </Link>
        ),
      )}

      {session && (
        <Link
          href="/profile"
          className={navLinkClass}
        >
          {t("profile")}
        </Link>
      )}

      {isAdmin && (
        <Link
          href="/admin"
          className={navLinkClass}
        >
          {t("admin")}
        </Link>
      )}

      <LanguageSwitcher />

      {session && (
        <span className="text-foreground/70 ml-2 hidden text-sm lg:inline">
          {t("logged_in_as")}{" "}
          <span className="text-accent font-semibold">
            {session.user?.name}
          </span>
        </span>
      )}

      {session ? (
        <SignOutButton className="text-primary-foreground bg-accent ml-4 font-semibold shadow-lg">
          {t("logout")}
        </SignOutButton>
      ) : (
        <SignInButton className="text-primary-foreground bg-accent ml-4 font-semibold shadow-lg">
          {t("login")}
        </SignInButton>
      )}
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
  tournamentGroups,
  hallOfFameLabel,
  t,
  onClose,
}: {
  isOpen: boolean;
  navItems: NavLinkProps[];
  isAdmin: boolean;
  session: Session | null;
  tournamentGroups: TournamentNavGroup[];
  hallOfFameLabel: string;
  t: (key: string) => string;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="border-primary/10 mt-4 border-t pt-4 md:hidden">
      <div className="flex flex-col space-y-3">
        {navItems.map((item) =>
          item.href === "/tournaments" ? (
            <TournamentsMobileMenu
              key={item.label}
              groups={tournamentGroups}
              label={item.label}
              hallOfFameLabel={hallOfFameLabel}
              linkClassName="text-foreground/80 hover:text-accent hover:bg-accent/10 rounded-md px-4 py-2 text-base font-semibold transition-colors"
              onNavigate={onClose}
            />
          ) : (
            <Link
              key={item.label}
              href={item.href}
              className="text-foreground/80 hover:text-accent hover:bg-accent/10 rounded-md px-4 py-2 text-base font-semibold transition-colors"
              onClick={onClose}
            >
              {item.label}
            </Link>
          ),
        )}

        {session && (
          <Link
            href="/profile"
            className="text-foreground/80 hover:text-accent hover:bg-accent/10 rounded-md px-4 py-2 text-base font-semibold transition-colors"
            onClick={onClose}
          >
            {t("profile")}
          </Link>
        )}

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

        <div className="px-4">
          <LanguageSwitcher />
        </div>

        <div className="px-4">
          {session ? (
            <SignOutButton className="text-primary-foreground bg-primary w-full font-semibold">
              {t("logout")}
            </SignOutButton>
          ) : (
            <SignInButton className="text-primary-foreground bg-primary w-full font-semibold">
              {t("login")}
            </SignInButton>
          )}
        </div>
      </div>
    </div>
  );
}
