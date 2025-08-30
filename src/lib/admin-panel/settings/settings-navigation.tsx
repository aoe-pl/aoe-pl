"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Settings, Users, Map, Shield, Database } from "lucide-react";
import type { SettingsSection } from "./types";

interface SettingsNavigationProps {
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
}

export function SettingsNavigation({
  activeSection,
  onSectionChange,
}: SettingsNavigationProps) {
  const t = useTranslations("admin.settings");

  const sections: SettingsSection[] = [
    {
      id: "civilizations",
      title: t("sections.civilizations"),
      icon: Crown,
      href: "/admin/settings/civilizations",
    },
    {
      id: "base-maps",
      title: t("sections.base_maps"),
      icon: Map,
      href: "/admin/settings/base-maps",
    },
    {
      id: "maps",
      title: t("sections.maps"),
      icon: Map,
      href: "/admin/settings/maps",
    },
    {
      id: "users",
      title: t("sections.users"),
      icon: Users,
      href: "/admin/settings/users",
    },
    {
      id: "roles",
      title: t("sections.roles"),
      icon: Shield,
      href: "/admin/settings/roles",
    },
    {
      id: "system",
      title: t("sections.system"),
      icon: Database,
      href: "/admin/settings/system",
    },
  ];

  return (
    <Card className="w-full lg:w-80">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <CardTitle className="text-lg">{t("title")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 lg:space-y-2">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1 lg:space-y-0">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            const isDisabled = ![
              "civilizations",
              "base-maps",
              "maps",
              "users",
            ].includes(section.id); // Only these are implemented for now

            return (
              <Button
                key={section.id}
                variant={isActive ? "default" : "ghost"}
                className="w-full justify-start text-left"
                onClick={() => onSectionChange(section.id)}
                disabled={isDisabled}
              >
                <Icon className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">{section.title}</span>
                {isDisabled && (
                  <Badge
                    variant="secondary"
                    className="ml-auto flex-shrink-0 text-xs"
                  >
                    {t("coming_soon")}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
