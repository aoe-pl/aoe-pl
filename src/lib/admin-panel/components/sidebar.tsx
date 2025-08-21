"use client";

import Link from "next/link";
import {
  HomeIcon,
  TrophyIcon,
  CogIcon,
  BackspaceIcon,
} from "@/components/icons";
import { Archive, Video } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function Sidebar() {
  const t = useTranslations("admin.sidebar");
  const pathname = usePathname();

  return (
    <aside className="bg-sidebar text-sidebar-foreground fixed top-0 left-0 z-40 flex h-full w-16 min-w-[64px] flex-col transition-all duration-300 md:w-64">
      <nav className="flex flex-1 flex-col overflow-y-auto">
        <NavItem
          href="/admin"
          icon={<HomeIcon />}
          active={pathname === "/admin"}
        >
          {t("dashboard")}
        </NavItem>
        <NavItem
          href="/admin/tournaments"
          icon={<TrophyIcon />}
          active={pathname === "/admin/tournaments"}
        >
          {t("tournaments")}
        </NavItem>
        <NavItem
          href="/admin/tournaments/archived"
          icon={<Archive className="h-5 w-5" />}
          active={pathname.startsWith("/admin/tournaments/archived")}
        >
          {t("archived_tournaments")}
        </NavItem>
        <NavItem
          href="/admin/streamers"
          icon={<Video className="h-5 w-5" />}
          active={pathname.startsWith("/admin/streamers")}
        >
          {t("streamers")}
        </NavItem>
        <NavItem
          href="/admin/settings"
          icon={<CogIcon />}
          active={pathname.startsWith("/admin/settings")}
        >
          {t("settings")}
        </NavItem>
        <NavItem
          href="/"
          icon={<BackspaceIcon />}
        >
          Exit Admin
        </NavItem>
      </nav>
    </aside>
  );
}

function NavItem({
  href,
  icon,
  children,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "hover:bg-sidebar-primary hover:text-sidebar-primary-foreground flex items-center justify-center gap-2 px-3 py-2 text-base transition-colors md:justify-start",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
          : "text-sidebar-foreground",
      )}
    >
      <span className="h-5 w-5">{icon}</span>
      <span className="hidden md:inline">{children}</span>
    </Link>
  );
}
