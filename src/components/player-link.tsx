"use client";

import { PatronBadge } from "@/components/profile/patron-badge";
import { api } from "@/trpc/react";
import Link from "next/link";

/**
 * Player name linking to the player's profile. Players holding the patron role
 * also get the patron emblem next to their name.
 */
export function PlayerLink({
  playerNumber,
  name,
}: {
  playerNumber: number | undefined;
  name: string;
}) {
  // A single shared query backs every player link on the page, so the patron
  // lookup does not turn into one request per rendered name.
  const { data: patronPlayerNumbers } =
    api.users.getPatronPlayerNumbers.useQuery(undefined, {
      staleTime: 5 * 60 * 1000,
    });

  const isPatron =
    playerNumber !== undefined && patronPlayerNumbers?.includes(playerNumber);

  return (
    <>
      {playerNumber === undefined ? (
        <span>{name}</span>
      ) : (
        <Link
          href={`/players/${playerNumber}`}
          className="hover:underline"
        >
          {name}
        </Link>
      )}
      {isPatron && <PatronBadge className="ml-1" />}
    </>
  );
}
