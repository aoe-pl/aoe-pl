"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  SettingsNavigation,
  CivilizationsList,
  BaseMapsList,
  MapsList,
} from "@/lib/admin-panel/settings";

export default function AdminSettingsPage() {
  const t = useTranslations("admin.settings");
  const [activeSection, setActiveSection] = useState("civilizations");

  const renderContent = () => {
    switch (activeSection) {
      case "civilizations":
        return <CivilizationsList />;
      case "base-maps":
        return <BaseMapsList />;
      case "maps":
        return <MapsList />;
      case "users":
      case "roles":
      case "system":
        return (
          <div className="flex items-center justify-center py-16">
            <div className="space-y-4 text-center">
              <h3 className="text-lg font-medium">{t("coming_soon_title")}</h3>
              <p className="text-muted-foreground">
                {t("coming_soon_description")}
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("page_title")}</h1>
        <p className="text-muted-foreground">{t("page_description")}</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <SettingsNavigation
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        <div className="min-w-0 flex-1">{renderContent()}</div>
      </div>
    </div>
  );
}
