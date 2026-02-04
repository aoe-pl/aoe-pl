import { getTranslations } from "next-intl/server";
import { NewsList } from "@/components/news/news-list";
import { auth } from "@/server/auth";
import { api } from "@/trpc/server";

export default async function NewsPage() {
  const t = await getTranslations("home.news");
  const session = await auth();
  const isAdmin = session ? await api.users.isAdmin() : false;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pt-24">
      <h1 className="mb-8 text-center text-3xl font-bold">{t("title")}</h1>
      <NewsList isAdmin={isAdmin} />
    </div>
  );
}
