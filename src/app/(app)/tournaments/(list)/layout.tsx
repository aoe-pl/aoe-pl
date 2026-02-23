import { getTranslations } from "next-intl/server";

export default async function TournamentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("tournaments");

  return (
    <>
      <div className="mx-auto max-w-4xl px-4 pt-28 pb-8">
        <div className="mb-10 text-center">
          <h1 className="text-foreground mb-4 text-4xl font-bold text-balance drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl">
            {t("title")}
          </h1>
          <div className="flex items-center justify-center gap-3">
            <div className="from-primary to-accent h-1 w-12 bg-gradient-to-r" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">{children}</div>
    </>
  );
}
