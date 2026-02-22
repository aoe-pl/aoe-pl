import { getTranslations } from "next-intl/server";
import { NewsList } from "@/components/news/news-list";
import { auth } from "@/server/auth";
import { api } from "@/trpc/server";

export default async function NewsPage() {
  const t = await getTranslations("news");
  const session = await auth();
  const isAdmin = session ? await api.users.isAdmin() : false;

  return (
    <div className="mx-auto max-w-4xl px-4 pt-28 pb-8">
      <div className="mb-10 text-center">
        <h1 className="text-foreground mb-4 text-4xl font-bold text-balance drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl">
          {t("title")}
        </h1>
        <div className="flex items-center justify-center gap-3">
          <div
            className="from-primary to-accent h-1 w-12 bg-gradient-to-r"
            aria-hidden="true"
          />
        </div>
      </div>
      <NewsList isAdmin={isAdmin} />
    </div>
  );
}
