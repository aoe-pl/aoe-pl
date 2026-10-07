"use client";

import {
  BaseMapsList,
  CivilizationsList,
  MapsList,
  SettingsNavigation,
  UsersList,
} from "@/lib/admin-panel/settings";
import { useTranslations } from "next-intl";
import { useState } from "react";

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
        return <UsersList />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-medieval-gold text-2xl font-bold tracking-tight">
          {t("page_title")}
        </h1>
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
