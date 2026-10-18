/**
 * Merge the accounts that were split by the migration.
 *
 * Usage (everything is a DRY-RUN unless `--commit` is given; each pair is merged
 * inside a transaction that is rolled back when dry-running, so the printed plan
 * is exactly what would happen):
 *
 *   # list the pairs that would be merged
 *   pnpm users:merge
 *
 *   # merge them all
 *   pnpm users:merge --commit
 *
 *   # merge a single pair instead (first = keeper). Refs: User.id | Discord id | #42
 *   pnpm users:merge 3f9c1a2b 123456789012345678 --commit
 *
 *   # additionally create the missing Discord Account rows for legacy users that
 *   # have not signed in yet — prevents new duplicates from appearing
 *   pnpm users:merge --link --commit
 *
 * NOTE: after merging a legacy row into a cuid account, do not re-run
 * `migration:commit` — the migration derives participant ids from the resolved
 * user id and would re-create the imported participations.
 */
import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const COMMIT = args.includes("--commit");
const AUTO = args.includes("--auto");
const LINK = args.includes("--link");
const positional = args.filter((a) => !a.startsWith("--"));

/** Discord ids are snowflakes; legacy users were imported with id = snowflake. */
const SNOWFLAKE = /^\d{15,21}$/;

/** Thrown to roll the transaction back (dry-run only). */
class DryRunRollback extends Error {}

// Delegates are used loosely on purpose: `tx` is a Prisma.TransactionClient and
// the pre-link helper runs outside a transaction.
type Tx = any;

/* ------------------------------------------------------------------ */
/* reporting                                                           */
/* ------------------------------------------------------------------ */
type Stats = {
  fields: string[];
  accounts: number;
  sessions: number;
  roles: number;
  rolesDropped: number;
  streams: number;
  streamsDropped: number;
  gameProfiles: number;
  gameProfilesDropped: number;
  newsPosts: number;
  series: number;
  matchesAuthored: number;
  matchStreams: number;
  matchStreamsDropped: number;
  participantsMoved: number;
  participantsDropped: number;
  groupSpotsDropped: number;
  matchSpotsDropped: number;
  bracketSpotsDropped: number;
  gameEntriesDropped: number;
  warnings: string[];
};

const emptyStats = (): Stats => ({
  fields: [],
  accounts: 0,
  sessions: 0,
  roles: 0,
  rolesDropped: 0,
  streams: 0,
  streamsDropped: 0,
  gameProfiles: 0,
  gameProfilesDropped: 0,
  newsPosts: 0,
  series: 0,
  matchesAuthored: 0,
  matchStreams: 0,
  matchStreamsDropped: 0,
  participantsMoved: 0,
  participantsDropped: 0,
  groupSpotsDropped: 0,
  matchSpotsDropped: 0,
  bracketSpotsDropped: 0,
  gameEntriesDropped: 0,
  warnings: [],
});

let stats = emptyStats();

const isBlank = (v: unknown) => v === null || v === undefined || v === "";

function printStats() {
  const entries: Array<[string, number]> = [
    ["login accounts moved", stats.accounts],
    ["sessions kept alive", stats.sessions],
    ["roles moved", stats.roles],
    ["roles dropped (already on keeper)", stats.rolesDropped],
    ["streams moved", stats.streams],
    ["streams dropped (already on keeper)", stats.streamsDropped],
    ["game profiles moved", stats.gameProfiles],
    ["game profiles dropped (keeper has one)", stats.gameProfilesDropped],
    ["news posts re-authored", stats.newsPosts],
    ["series ownership moved", stats.series],
    ["matches authored (createdBy)", stats.matchesAuthored],
    ["match streams moved", stats.matchStreams],
    ["match streams dropped", stats.matchStreamsDropped],
    ["participations handed over", stats.participantsMoved],
    ["old participations dropped (same tournament)", stats.participantsDropped],
    ["  group spots dropped with them", stats.groupSpotsDropped],
    ["  match spots dropped with them", stats.matchSpotsDropped],
    ["  bracket spots dropped with them", stats.bracketSpotsDropped],
    ["  game entries dropped with them", stats.gameEntriesDropped],
  ];

  const moved = entries.filter((entry) => entry[1] > 0);
  for (const entry of moved) console.log(`    ${entry[0]}: ${entry[1]}`);
  if (stats.fields.length > 0)
    console.log(
      `    fields filled from the old account: ${stats.fields.join(", ")}`,
    );
  if (moved.length === 0 && stats.fields.length === 0)
    console.log("    (nothing to move)");
  for (const w of stats.warnings) console.log(`    ! ${w}`);
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */
type UserRef = { id: string; playerNumber: number; name: string | null };

const describeUser = (u: UserRef) =>
  `${u.id} (#${u.playerNumber}${u.name ? `, ${u.name}` : ""})`;

const userSelect = {
  id: true,
  playerNumber: true,
  name: true,
} as const;

/** Accepts a User.id, a Discord id (Account.providerAccountId) or "#123". */
async function resolveUserRef(raw: string): Promise<UserRef> {
  const byId = await prisma.user.findUnique({
    where: { id: raw },
    select: userSelect,
  });
  if (byId) return byId;

  const byAccount = await prisma.account.findFirst({
    where: { provider: "discord", providerAccountId: raw },
    select: { user: { select: userSelect } },
  });
  if (byAccount) return byAccount.user;

  if (/^#?\d+$/.test(raw)) {
    const byNumber = await prisma.user.findUnique({
      where: { playerNumber: Number(raw.replace("#", "")) },
      select: userSelect,
    });
    if (byNumber) return byNumber;
  }

  throw new Error(
    `no user found for "${raw}" (expected a User.id, a Discord id or "#playerNumber")`,
  );
}

async function participantCounts(ids: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (ids.length === 0) return out;
  const rows = await prisma.tournamentParticipant.groupBy({
    by: ["userId"],
    where: { userId: { in: ids } },
    _count: { _all: true },
  });
  for (const row of rows) if (row.userId) out.set(row.userId, row._count._all);
  return out;
}

/* ------------------------------------------------------------------ */
/* duplicate detection                                                 */
/* ------------------------------------------------------------------ */
type Pair = { keeperId: string; dupId: string };

/**
 * A pair is a legacy row (User.id = discord snowflake, holds the history) plus
 * the row owning the Discord account of that snowflake (= the new account, the
 * keeper). Returns newest-first by how much history the old row brings.
 */
async function findDuplicatePairs(): Promise<Pair[]> {
  const accounts = await prisma.account.findMany({
    where: { provider: "discord" },
    select: { providerAccountId: true, userId: true },
  });

  const claimed = [
    ...new Set(
      accounts
        .map((a) => a.providerAccountId)
        .filter((id) => SNOWFLAKE.test(id)),
    ),
  ];
  const legacy = await prisma.user.findMany({
    where: { id: { in: claimed } },
    select: { id: true },
  });
  const legacyIds = new Set(legacy.map((u) => u.id));

  const pairs: Pair[] = [];
  const seen = new Set<string>();
  for (const account of accounts) {
    const legacyId = account.providerAccountId;
    if (account.userId === legacyId) continue; // already the same row
    if (!legacyIds.has(legacyId)) continue; // migrated row is gone
    if (seen.has(legacyId)) continue; // multiple accounts, same pair
    seen.add(legacyId);
    pairs.push({ keeperId: account.userId, dupId: legacyId });
  }

  const counts = await participantCounts(pairs.map((p) => p.dupId));
  return pairs.sort(
    (a, b) => (counts.get(b.dupId) ?? 0) - (counts.get(a.dupId) ?? 0),
  );
}

/* ------------------------------------------------------------------ */
/* the merge itself                                                    */
/* ------------------------------------------------------------------ */
/**
 * Hands everything owned by `dupId` (the migrated row) over to `keeperId` (the
 * new account) and deletes the old row. Must run inside a transaction: any
 * relation we failed to handle makes the final `user.delete` throw, so nothing
 * is lost silently.
 */
async function mergeUsers(tx: Tx, keeperId: string, dupId: string) {
  if (keeperId === dupId)
    throw new Error("keeper and duplicate are the same user");

  const keeper = await tx.user.findUniqueOrThrow({ where: { id: keeperId } });
  const dup = await tx.user.findUniqueOrThrow({ where: { id: dupId } });

  /* ---- 1. profile: keeper wins, the old row only fills gaps ----- */
  const patch: Record<string, unknown> = {};
  for (const field of [
    "name",
    "image",
    "color",
    "aoe2companionUrl",
    "streamUrl",
    "email",
  ] as const) {
    const k = keeper[field];
    const d = dup[field];
    if (isBlank(k) && !isBlank(d)) {
      patch[field] = d;
      stats.fields.push(field);
    } else if (!isBlank(k) && !isBlank(d) && k !== d) {
      stats.warnings.push(
        `${field}: keeping "${k}" from the new account, ignoring old value "${d}"`,
      );
    }
  }
  // An email is only "verified" together with the address it belongs to.
  if (patch.email !== undefined) patch.emailVerified = dup.emailVerified;

  // Admin notes are the only thing worth keeping from both sides.
  const keeperNote = isBlank(keeper.adminComment) ? "" : keeper.adminComment;
  const dupNote = isBlank(dup.adminComment) ? "" : dup.adminComment;
  if (dupNote) {
    if (!keeperNote) {
      patch.adminComment = dupNote;
      stats.fields.push("adminComment");
    } else if (keeperNote !== dupNote) {
      patch.adminComment = `${keeperNote}\n\n${dupNote}`;
      stats.fields.push("adminComment (appended)");
    }
  }

  if (Object.keys(patch).length > 0)
    await tx.user.update({ where: { id: keeperId }, data: patch });

  /* ---- 2. login accounts (normally already on the keeper) ------- */
  for (const account of await tx.account.findMany({
    where: { userId: dupId },
  })) {
    const clash = await tx.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: account.provider,
          providerAccountId: account.providerAccountId,
        },
      },
      select: { userId: true },
    });
    if (clash?.userId === keeperId) {
      await tx.account.delete({ where: { id: account.id } });
      stats.warnings.push(
        `account ${account.provider}:${account.providerAccountId} already on the keeper - dropped the copy`,
      );
      continue;
    }
    await tx.account.update({
      where: { id: account.id },
      data: { userId: keeperId },
    });
    stats.accounts++;
  }

  /* ---- 3. sessions: keep people logged in ---------------------- */
  const sessions = await tx.session.updateMany({
    where: { userId: dupId },
    data: { userId: keeperId },
  });
  stats.sessions += sessions.count;

  /* ---- 4. roles: @@unique([userId, roleId]) -------------------- */
  const keeperRoleIds = new Set<string>(
    (
      await tx.userRole.findMany({
        where: { userId: keeperId },
        select: { roleId: true },
      })
    ).map((r: { roleId: string }) => r.roleId),
  );
  for (const role of await tx.userRole.findMany({ where: { userId: dupId } })) {
    if (keeperRoleIds.has(role.roleId)) {
      await tx.userRole.delete({ where: { id: role.id } });
      stats.rolesDropped++;
      continue;
    }
    await tx.userRole.update({
      where: { id: role.id },
      data: { userId: keeperId },
    });
    keeperRoleIds.add(role.roleId);
    stats.roles++;
  }

  /* ---- 5. streams (no unique key in the schema) --------------- */
  const keeperPlatforms = new Set<string>(
    (
      await tx.userStream.findMany({
        where: { userId: keeperId },
        select: { platformId: true },
      })
    ).map((s: { platformId: string }) => s.platformId),
  );
  for (const stream of await tx.userStream.findMany({
    where: { userId: dupId },
  })) {
    if (keeperPlatforms.has(stream.platformId)) {
      await tx.userStream.delete({ where: { id: stream.id } });
      stats.streamsDropped++;
      continue;
    }
    await tx.userStream.update({
      where: { id: stream.id },
      data: { userId: keeperId },
    });
    keeperPlatforms.add(stream.platformId);
    stats.streams++;
  }

  /* ---- 6. game profiles: @@unique([userId, mainAccount]) ------- */
  const keeperFlags = new Set<boolean>(
    (
      await tx.userGameProfile.findMany({
        where: { userId: keeperId },
        select: { mainAccount: true },
      })
    ).map((p: { mainAccount: boolean }) => p.mainAccount),
  );
  for (const profile of await tx.userGameProfile.findMany({
    where: { userId: dupId },
  })) {
    if (keeperFlags.has(profile.mainAccount)) {
      await tx.userGameProfile.delete({ where: { id: profile.id } });
      stats.gameProfilesDropped++;
      stats.warnings.push(
        `game profile ${profile.platformId}/${profile.statProfileId} dropped: the new account already has a ${profile.mainAccount ? "main" : "secondary"} profile`,
      );
      continue;
    }
    await tx.userGameProfile.update({
      where: { id: profile.id },
      data: { userId: keeperId },
    });
    keeperFlags.add(profile.mainAccount);
    stats.gameProfiles++;
  }

  /* ---- 7. authorship / ownership ------------------------------ */
  const news = await tx.newsPost.updateMany({
    where: { authorId: dupId },
    data: { authorId: keeperId },
  });
  const series = await tx.tournamentSeries.updateMany({
    where: { ownerId: dupId },
    data: { ownerId: keeperId },
  });
  // Plain string column without a relation.
  const authored = await tx.tournamentMatch.updateMany({
    where: { createdBy: dupId },
    data: { createdBy: keeperId },
  });
  stats.newsPosts += news.count;
  stats.series += series.count;
  stats.matchesAuthored += authored.count;

  /* ---- 8. match streams: @@unique([matchId, streamerId]) ------- */
  const keeperStreamedMatches = new Set<string>(
    (
      await tx.tournamentMatchStream.findMany({
        where: { streamerId: keeperId },
        select: { tournamentMatchId: true },
      })
    ).map((s: { tournamentMatchId: string }) => s.tournamentMatchId),
  );
  for (const stream of await tx.tournamentMatchStream.findMany({
    where: { streamerId: dupId },
  })) {
    if (keeperStreamedMatches.has(stream.tournamentMatchId)) {
      await tx.tournamentMatchStream.delete({ where: { id: stream.id } });
      stats.matchStreamsDropped++;
      continue;
    }
    await tx.tournamentMatchStream.update({
      where: { id: stream.id },
      data: { streamerId: keeperId },
    });
    keeperStreamedMatches.add(stream.tournamentMatchId);
    stats.matchStreams++;
  }

  /* ---- 9. tournament participations --------------------------- */
  for (const oldP of await tx.tournamentParticipant.findMany({
    where: { userId: dupId },
    include: { tournament: { select: { name: true } } },
  })) {
    const newP = await tx.tournamentParticipant.findFirst({
      where: { tournamentId: oldP.tournamentId, userId: keeperId },
      select: { id: true, nickname: true, status: true },
    });

    // The normal case: a tournament the new account never entered -> the
    // participation is simply handed over (nickname and history stay intact).
    if (!newP) {
      await tx.tournamentParticipant.update({
        where: { id: oldP.id },
        data: { userId: keeperId },
      });
      stats.participantsMoved++;
      continue;
    }

    // Both rows entered the same tournament (should not happen): the new
    // registration wins, the old participant is dropped with its spots.
    const [groups, matches, brackets] = await Promise.all([
      tx.tournamentGroupParticipant.count({
        where: { tournamentParticipantId: oldP.id },
      }),
      tx.tournamentMatchParticipant.count({
        where: { participantId: oldP.id },
      }),
      tx.tournamentBracketParticipant.count({
        where: { participantId: oldP.id },
      }),
    ]);
    const games = await tx.gameParticipant.deleteMany({
      where: { matchParticipant: { participantId: oldP.id } },
    });
    await tx.tournamentMatchParticipant.deleteMany({
      where: { participantId: oldP.id },
    });
    await tx.tournamentGroupParticipant.deleteMany({
      where: { tournamentParticipantId: oldP.id },
    });
    await tx.tournamentBracketParticipant.deleteMany({
      where: { participantId: oldP.id },
    });
    // Captaincy is worth keeping even though the row goes away.
    await tx.tournamentTeam.updateMany({
      where: { captainId: oldP.id },
      data: { captainId: newP.id },
    });
    await tx.tournamentParticipant.delete({ where: { id: oldP.id } });

    stats.participantsDropped++;
    stats.groupSpotsDropped += groups;
    stats.matchSpotsDropped += matches;
    stats.bracketSpotsDropped += brackets;
    stats.gameEntriesDropped += games.count;
    stats.warnings.push(
      `same tournament twice in "${oldP.tournament.name}" - kept "${newP.nickname}" (${newP.status}), dropped the old participation "${oldP.nickname}" (${oldP.status}) with ${groups} group / ${matches} match / ${brackets} bracket spot(s)`,
    );
  }

  /* ---- 10. drop the old row ------------------------------------ */
  // Anything still pointing at it (a relation we missed) makes this throw.
  await tx.user.delete({ where: { id: dupId } });

  /* ---- 11. make sure the login now resolves to the keeper ------ */
  if (SNOWFLAKE.test(dupId)) {
    const linked = await tx.account.findFirst({
      where: {
        userId: keeperId,
        provider: "discord",
        providerAccountId: dupId,
      },
      select: { id: true },
    });
    if (!linked)
      stats.warnings.push(
        `the Discord account ${dupId} is NOT on the keeper - the next sign-in would create another duplicate`,
      );
  }
}

/* ------------------------------------------------------------------ */
/* pre-linking                                                         */
/* ------------------------------------------------------------------ */
/**
 * Creates the missing `Account` row for every legacy user (`User.id` = snowflake)
 * that has not signed in yet. Users who already have a duplicate are skipped,
 * because their snowflake is claimed by that duplicate until the merge moves it.
 */
async function linkLegacyAccounts() {
  const users = await prisma.user.findMany({ select: { id: true } });
  const taken = new Set<string>(
    (
      await prisma.account.findMany({
        where: { provider: "discord" },
        select: { providerAccountId: true },
      })
    ).map((a) => a.providerAccountId),
  );

  const ids = users
    .map((u) => u.id)
    .filter((id) => SNOWFLAKE.test(id) && !taken.has(id));

  console.log(
    `\nAccounts: ${ids.length} legacy user(s) without a Discord link${COMMIT ? "" : " (dry-run)"}`,
  );
  if (ids.length === 0) return;

  const data = ids.map((id) => ({
    // Deterministic id + skipDuplicates keeps re-runs idempotent.
    id: `acc_discord_${id}`,
    userId: id,
    type: "oauth",
    provider: "discord",
    providerAccountId: id,
  }));

  if (!COMMIT) {
    console.log(
      `  would link: ${ids.slice(0, 10).join(", ")}${ids.length > 10 ? ", …" : ""}`,
    );
    return;
  }
  for (let i = 0; i < data.length; i += 500) {
    await prisma.account.createMany({
      data: data.slice(i, i + 500),
      skipDuplicates: true,
    });
  }
  console.log(`  linked ${data.length} account(s)`);
}

/* ------------------------------------------------------------------ */
/* runner                                                             */
/* ------------------------------------------------------------------ */
async function runPair(pair: Pair) {
  stats = emptyStats();
  const [keeper, dup] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: pair.keeperId },
      select: userSelect,
    }),
    prisma.user.findUniqueOrThrow({
      where: { id: pair.dupId },
      select: userSelect,
    }),
  ]);

  console.log(
    `\n── keep ${describeUser(keeper)}   <-  absorb ${describeUser(dup)}`,
  );

  let rolledBack = false;
  try {
    await prisma.$transaction(
      async (tx) => {
        await mergeUsers(tx, pair.keeperId, pair.dupId);
        if (!COMMIT) throw new DryRunRollback();
      },
      { timeout: 120_000, maxWait: 30_000 },
    );
  } catch (e) {
    if (e instanceof DryRunRollback) rolledBack = true;
    else {
      printStats();
      throw e;
    }
  }

  printStats();
  console.log(
    `    playerNumber #${keeper.playerNumber} kept, #${dup.playerNumber} disappears (profile URLs using it will 404)`,
  );
  if (rolledBack) console.log("    (dry-run: rolled back)");
}

function printUsage() {
  console.log(`
Merge the accounts split by the migration.

  pnpm users:merge                     list every detected pair (dry-run)
  pnpm users:merge --commit            merge them all
  pnpm users:merge --link              list legacy users that never signed in
  pnpm users:merge --link --commit     pre-link them (prevents new duplicates)

One pair at a time: the FIRST reference is the keeper (it survives, keeps its id,
playerNumber, name, email and links), the SECOND is the old migrated row (its
tournament history is absorbed, then the row is deleted):

  pnpm users:merge '#437' 243828334447886336                  dry-run
  pnpm users:merge '#437' 243828334447886336 --commit         for real

A reference can be any of:

  243828334447886336          User.id of a migrated row, or a Discord id
  cmb8x1q2e0000v7wxyz3a4bcde  User.id of a new account (cuid)
  '#437'                      User.playerNumber (the number in /players/437)

Resolution order is User.id, then Account.providerAccountId, then playerNumber.
Quote "#437": in bash an unquoted # starts a comment.
`);
}

async function main() {
  console.log(`\n=== user merge (${COMMIT ? "COMMIT" : "DRY-RUN"}) ===`);

  if (LINK && !AUTO && positional.length === 0) {
    await linkLegacyAccounts();
    console.log("");
    return;
  }

  if (positional.length === 2) {
    const keeper = await resolveUserRef(positional[0]!);
    const old = await resolveUserRef(positional[1]!);
    if (keeper.id === old.id)
      throw new Error("both references point to the same user");

    const owner = await prisma.account.findFirst({
      where: {
        provider: "discord",
        providerAccountId: old.id,
        userId: keeper.id,
      },
      select: { id: true },
    });
    if (!owner)
      console.log(
        `\n!! ${keeper.id} does not own the Discord account of ${old.id} - the login is moved over anyway, but check the direction (keeper = new account)`,
      );
    await runPair({ keeperId: keeper.id, dupId: old.id });
  } else if (positional.length === 1) {
    throw new Error("give two user references (keeper first) or no arguments");
  } else if (positional.length > 2) {
    throw new Error("expected exactly two user references");
  }

  if (AUTO || positional.length === 0) {
    const pairs = await findDuplicatePairs();
    console.log(
      `\nDuplicates found: ${pairs.length}${pairs.length === 0 ? " (every legacy user is linked correctly)" : ""}`,
    );
    for (const pair of pairs) await runPair(pair);
    if (pairs.length > 0)
      console.log(
        `\n${pairs.length} pair(s) ${COMMIT ? "merged" : "would be merged - re-run with --commit"}`,
      );
  }

  if (LINK) await linkLegacyAccounts();

  console.log("");
}

main()
  .catch((e) => {
    console.error(`\n${e instanceof Error ? e.message : String(e)}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
