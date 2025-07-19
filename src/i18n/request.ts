import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  // Provide a static locale, fetch a user setting,
  // read from `cookies()`, `headers()`, etc.
  const locale = "pl";

  return {
    locale,
    // eslint-disable-next-line
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
