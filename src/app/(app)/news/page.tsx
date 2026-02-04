import { useTranslations } from "next-intl";

export default function NewsPage() {
  const t = useTranslations("navigation");

  return (
    <div className="container mx-auto py-8 pt-24">
      <h1 className="mb-6 text-center text-3xl font-bold">{t("news")}</h1>
    </div>
  );
}
