"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs } from "@/components/ui/tabs";
import { type ReactNode, useState } from "react";

interface TournamentTabsProps {
  children: ReactNode;
  tabKeys: string[];
}

export function TournamentTabs({ children, tabKeys }: TournamentTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [tab, setTab] = useState(tabParam ?? tabKeys[0]);

  const handleTabChange = (value: string) => {
    setTab(value);
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("tab", value);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <Tabs
      value={tab}
      onValueChange={handleTabChange}
      className="w-full"
    >
      {children}
    </Tabs>
  );
}
