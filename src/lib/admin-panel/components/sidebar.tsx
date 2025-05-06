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

export function Sidebar() {
  return (
    <aside className="fixed top-0 left-0 z-40 flex h-full w-16 min-w-[64px] flex-col bg-[#232a36] text-white transition-all duration-300 md:w-64">
      <div className="flex items-center gap-2 px-4 py-6 text-2xl font-bold">
        <span className="text-yellow-400">🏆</span>
        <span className="hidden md:inline">AoE2 Admin</span>
      </div>
      <nav className="mt-4 flex flex-1 flex-col gap-1 overflow-y-auto">
        <Link
          href="/admin"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-base transition-colors hover:bg-[#2d3646]"
        >
          <span className="h-5 w-5">
            <HomeIcon />
          </span>
          <span className="hidden md:inline">Home</span>
        </Link>
        <Link
          href="/admin"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-base transition-colors hover:bg-[#2d3646]"
        >
          <span className="h-5 w-5">
            <TrophyIcon />
          </span>
          <span className="hidden md:inline">Tournaments</span>
        </Link>
        <Link
          href="/admin/news"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-base transition-colors hover:bg-[#2d3646]"
        >
          <span className="h-5 w-5">
            <NewsIcon />
          </span>
          <span className="hidden md:inline">News</span>
        </Link>
        <Link
          href="/admin/users"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-base transition-colors hover:bg-[#2d3646]"
        >
          <span className="h-5 w-5">
            <UsersIcon />
          </span>
          <span className="hidden md:inline">Users</span>
        </Link>
        <Link
          href="/admin/settings"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-base transition-colors hover:bg-[#2d3646]"
        >
          <span className="h-5 w-5">
            <CogIcon />
          </span>
          <span className="hidden md:inline">Settings</span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-base transition-colors hover:bg-[#2d3646]"
        >
          <span className="h-5 w-5">
            <BackspaceIcon />
          </span>
          <span className="hidden md:inline">Exit Admin</span>
        </Link>
      </nav>
    </aside>
  );
}
