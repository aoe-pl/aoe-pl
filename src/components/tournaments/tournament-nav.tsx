"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export interface TournamentNavLink {
  href: string;
  label: string;
}

interface TournamentNavProps {
  links: TournamentNavLink[];
}

function useActiveLink(links: TournamentNavLink[]) {
  const pathname = usePathname();
  return links.find(
    (l) => pathname === l.href || pathname.startsWith(l.href + "/"),
  );
}

export function TournamentNav({ links }: TournamentNavProps) {
  const active = useActiveLink(links);

  return (
    <nav className="panel flex flex-col gap-1">
      {links.map((link) => {
        const isActive = active?.href === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            replace
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary border-primary/10 border"
                : "hover:bg-muted",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function TournamentNavMobile({ links }: TournamentNavProps) {
  const active = useActiveLink(links);
  const router = useRouter();

  return (
    <Select
      value={active?.href ?? links[0]?.href}
      onValueChange={(href) => router.replace(href)}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {links.map((link) => (
          <SelectItem
            key={link.href}
            value={link.href}
          >
            {link.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
