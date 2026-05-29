import { usersRepository } from "@/lib/repositories/usersRepository";
import { auth } from "@/server/auth";
import { cache } from "react";

/**
 * Per-request cached session. Calling this multiple times in the same RSC tree
 * (e.g. layout + page) only hits the DB once.
 */
export const getSession = cache(() => auth());

/**
 * Per-request cached isAdmin check. Layout and page can both call this
 * without triggering duplicate queries.
 */
export const getIsAdmin = cache(async () => {
  const session = await getSession();

  if (!session?.user?.id) return false;

  return usersRepository.isUserAdmin(session.user.id);
});
