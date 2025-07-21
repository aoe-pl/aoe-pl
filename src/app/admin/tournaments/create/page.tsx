import { TournamentCreate } from "@/lib/admin-panel/tournaments/tournament-create";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumbs";
import { getTranslations } from "next-intl/server";

export default async function CreateTournamentPage() {
  const t = await getTranslations("admin");

  return (
    <div className="flex flex-col gap-4">
      <div className="py-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/tournaments">
                {t("tournaments.title")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t("tournaments.create_title")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <TournamentCreate />
    </div>
  );
}
