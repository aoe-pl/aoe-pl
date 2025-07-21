import {
  Breadcrumb,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumbs";
import { TournamentEdit } from "@/lib/admin-panel/tournaments/tournament-edit";
import { api } from "@/trpc/server";
import { getTranslations } from "next-intl/server";

export default async function AdminTournamentEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tournament = await api.tournaments.get({ id: slug });
  const t = await getTranslations("admin.tournaments");

  if (!tournament) {
    return <div>Tournament not found</div>;
  }

  return (
    <>
      <div className="py-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/tournaments">
                {t("title")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/admin/tournaments/view/${slug}`}>
                {tournament.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t("edit_title")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="rounded-xl p-8 text-white">
        <TournamentEdit tournament={tournament} />
      </div>
    </>
  );
}
