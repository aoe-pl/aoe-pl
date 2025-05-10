"use client";

import Link from "next/link";
import {
  HomeIcon,
  NewsIcon,
  TrophyIcon,
  UsersIcon,
  CogIcon,
  BackspaceIcon,
} from "@/components/icons";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 left-0 z-40 flex h-full w-16 min-w-[64px] flex-col bg-[#232a36] text-white transition-all duration-300 md:w-64">
      <div className="flex items-center gap-2 px-4 py-6 text-2xl font-bold">
        <span className="text-yellow-400">🏆</span>
        <span className="hidden md:inline">AoE2 Admin</span>
      </div>
      <nav className="mt-4 flex flex-1 flex-col gap-1 overflow-y-auto">
        <NavItem
          href="/admin"
          icon={<HomeIcon />}
          active={pathname === "/admin"}
        >
          Dashboard
        </NavItem>
        <NavItem
          href="/admin/tournaments"
          icon={<TrophyIcon />}
          active={pathname.startsWith("/admin/tournaments")}
        >
          Tournaments
        </NavItem>
        <NavItem
          href="/admin/news"
          icon={<NewsIcon />}
          active={pathname.startsWith("/admin/news")}
        >
          News
        </NavItem>
        <NavItem
          href="/admin/users"
          icon={<UsersIcon />}
          active={pathname.startsWith("/admin/users")}
        >
          Users
        </NavItem>
        <NavItem
          href="/admin/settings"
          icon={<CogIcon />}
          active={pathname.startsWith("/admin/settings")}
        >
          Settings
        </NavItem>
        <NavItem href="/" icon={<BackspaceIcon />}>
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
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-base transition-colors hover:bg-[#2d3646] ${active ? "bg-[#2d3646] font-semibold text-white" : "text-gray-300"}`}
    >
      <span className="h-5 w-5">{icon}</span>
      <span className="hidden md:inline">{children}</span>
    </Link>
  );
}
