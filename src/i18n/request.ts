import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { locales } from "@/lib/locales";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get(locales.key)?.value;

  const isSupported = locales.list.some((l) => l.code === rawLocale);

  const locale = rawLocale && isSupported ? rawLocale : locales.default;

  return {
    locale,
    // eslint-disable-next-line
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
