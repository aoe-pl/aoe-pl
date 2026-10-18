"use server";

import { safeRedirectPath } from "@/lib/helpers/redirect";
import { signIn, signOut } from "@/server/auth";

/**
 * Starts the Discord OAuth flow. Usable directly as a `<form action>` so the
 * buttons still work if JavaScript is disabled.
 */
export async function signInWithDiscord(callbackUrl?: string) {
  await signIn("discord", { redirectTo: safeRedirectPath(callbackUrl) });
}

/**
 * Ends the current session and sends the user back to the home page.
 */
export async function signOutUser() {
  await signOut({ redirectTo: "/" });
}
