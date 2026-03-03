import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { type NextRequest } from "next/server";
import { locales } from "@/lib/locales";

// This route is used to set the locale cookie and redirect back to the page the user was on.
export async function GET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get(locales.key);
  const returnTo = request.nextUrl.searchParams.get("returnTo") ?? "/";
  const cookieStore = await cookies();
  const isSupported = locales.list.some((l) => l.code === locale);

  if (locale && isSupported) {
    cookieStore.set(locales.key, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  redirect(returnTo);
}
