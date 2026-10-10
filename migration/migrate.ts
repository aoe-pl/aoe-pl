/**
 * One-off data migration: old AoE2PL Postgres (TypeORM) -> new Postgres (Prisma).
 *
 *   # dry-run
 *   pnpm migration:dry
 *
 *   # actually write
 *   pnpm migration:commit
 */
import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

import { CIV_NAMES, MAP_NAMES } from "./civ-data";

const COMMIT = process.argv.includes("--commit");

const prisma = new PrismaClient();

/**
 * Source connection. ALWAYS read-only: the session is pinned to read-only
 * transactions and given a statement timeout, so no write can reach the legacy
 * database even if the credentials allowed it.
 */
const old = new Pool({
  connectionString: process.env.OLD_DATABASE_URL,
  options: "-c default_transaction_read_only=on -c statement_timeout=600000",
  connectionTimeoutMillis: 8000,
  max: 4,
});

type Row = Record<string, any>;

const q = async (sql: string): Promise<Row[]> => (await old.query(sql)).rows;
const slug = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const chunks = <T>(arr: T[], size = 500): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};
const push = <K, V>(m: Map<K, V[]>, k: K, v: V) => {
  const a = m.get(k);
  if (a) a.push(v);
  else m.set(k, [v]);
};

/**
 * Legacy rotation groups are named "<group A> 🔁 <group B>" (or with 🔄) but the
 * old database never flagged them. Detect the rotation symbol in the name so the
 * imported groups get `isRotational: true` in the new schema — otherwise they
 * show up as regular groups (e.g. in player tournament history).
 */
const ROTATION_EMOJI = /[\u{1F501}\u{1F504}]/u; // 🔁 / 🔄

/* ------------------------------------------------------------------ */
/* civ / map resolution                                                */
/* ------------------------------------------------------------------ */
// name -> lowest numeric id (ids are the strings the new frontend expects)
const civByKey = new Map<string, { id: string; name: string }>();
for (const [id, name] of Object.entries(CIV_NAMES)) {
  const key = norm(name);
  const cur = civByKey.get(key);
  if (!cur || Number(id) < Number(cur.id)) civByKey.set(key, { id, name });
}
const CIV_ALIASES: Record<string, string> = { mayans: "Maya" };

function resolveCiv(raw?: string | null): { id: string; name: string } | null {
  if (!raw?.trim()) return null;
  const name = CIV_ALIASES[raw.trim().toLowerCase()] ?? raw.trim();
  return civByKey.get(norm(name)) ?? null;
}

const mapByKey = new Map<string, { id: string; name: string }>();
for (const [id, name] of Object.entries(MAP_NAMES)) {
  const key = norm(name);
  const cur = mapByKey.get(key);
  if (!cur || Number(id) < Number(cur.id)) mapByKey.set(key, { id, name });
}
const MAP_ALIASES: Record<string, string> = { scandanavia: "scandinavia" };

function cleanMapName(raw: string): string {
  let s = raw.trim();
  const i = s.lastIndexOf(" - ");
  if (i !== -1) s = s.slice(i + 3).trim();
  s = s.replace(/\s*\([^)]*\)\s*$/, "").trim(); // strip trailing "(...)"
  s = s.replace(/^(ant\d*[a-z]*|nlr|npl|well[-\w]*|qs)\s+/i, "").trim();
  return s;
}

function resolveMap(
  raw?: string | null,
): { id: string; name: string; custom: boolean } | null {
  if (!raw?.trim()) return null;
  const cleaned = cleanMapName(raw);
  if (!cleaned) return null;
  const key = MAP_ALIASES[norm(cleaned)] ?? norm(cleaned);
  const known = mapByKey.get(key);
  if (known) return { id: known.id, name: known.name, custom: false };
  return { id: `custom_${slug(cleaned)}`, name: cleaned, custom: true };
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */
async function insertMany(model: any, data: any[]): Promise<number> {
  if (!COMMIT || data.length === 0) return data.length;
  for (const part of chunks(data)) {
    await model.createMany({ data: part, skipDuplicates: true });
  }
  return data.length;
}

async function ensureSection(s: {
  tournamentId: string;
  slug: string;
  title: string;
  content: string;
  displayOrder: number;
}): Promise<void> {
  if (!COMMIT) return;
  const existing = await prisma.tournamentSection.findUnique({
    where: {
      tournamentId_slug: { tournamentId: s.tournamentId, slug: s.slug },
    },
    select: { id: true },
  });
  if (existing) return; // leave the site's default section alone
  await prisma.tournamentSection.create({
    data: {
      id: `sec_${s.tournamentId}_${s.slug}`,
      tournamentId: s.tournamentId,
      slug: s.slug,
      isVisible: true,
      displayOrder: s.displayOrder,
      translations: {
        create: { locale: "pl", title: s.title, content: s.content },
      },
    },
  });
}

/* ------------------------------------------------------------------ */
/* main                                                                */
/* ------------------------------------------------------------------ */
async function main() {
  console.log(
    `\n=== AoE2PL migration (${COMMIT ? "COMMIT" : "DRY-RUN"}) ===\n`,
  );

  // ---- load source -------------------------------------------------
  const users = await q(`SELECT * FROM "user"`);
  const tournaments = await q(`SELECT * FROM tournament`);
  const groups = await q(`SELECT * FROM tournament_group`);
  const matches = await q(`SELECT * FROM match`);
  const mpd = await q(`SELECT * FROM match_player_data`);
  const games = await q(`SELECT * FROM game`);
  const gpd = await q(`SELECT * FROM game_player_data`);
  const jTourUsers = await q(`SELECT * FROM user_tournaments_tournament`);
  const jGroupUsers = await q(
    `SELECT * FROM user_tournament_groups_tournament_group`,
  );
  const tpd = await q(`SELECT * FROM tournament_participant_data`);
  const jTpd = await q(
    `SELECT * FROM tournament_participants_data_tournament_participant_data`,
  );

  const userById = new Map(users.map((u) => [u.discord_id as string, u]));
  const groupById = new Map(groups.map((g) => [Number(g.id), g]));
  const tournamentById = new Map(tournaments.map((t) => [Number(t.id), t]));
  const tpdById = new Map(tpd.map((t) => [Number(t.id), t]));

  // ---- resolve identities against the target -----------------------
  // Accounts created through the new site get a cuid() User.id and keep the
  // Discord id in Account.providerAccountId, whereas legacy users are keyed by
  // the numeric Discord id. Match on the Discord account FIRST, so we never
  // duplicate a user that already exists in the new database. Only when there
  // is no such account do we create a fresh user with id = discord_id.
  const discordToUserId = new Map<string, string>();
  const existingUserIds = new Set<string>();
  // Series names are not unique in the schema, so match by (lowercased) name and
  // reuse an existing series instead of creating a duplicate.
  const existingSeriesByName = new Map<string, string>();
  try {
    const accounts = await prisma.account.findMany({
      where: { provider: "discord" },
      select: { providerAccountId: true, userId: true },
    });
    for (const a of accounts)
      discordToUserId.set(a.providerAccountId, a.userId);
    const existing = await prisma.user.findMany({ select: { id: true } });
    for (const u of existing) existingUserIds.add(u.id);
    const existingSeries = await prisma.tournamentSeries.findMany({
      select: { id: true, name: true },
    });
    for (const s of existingSeries) {
      const key = s.name.trim().toLowerCase();
      const prev = existingSeriesByName.get(key);
      // Prefer an app-created series over a previously imported one (ts_*).
      if (prev && !prev.startsWith("ts_")) continue;
      existingSeriesByName.set(key, s.id);
    }
  } catch {
    /* target may be unreachable in dry-run; treat everyone as new */
  }
  const resolveUserId = (did: string) => discordToUserId.get(did) ?? did;

  const nickname = (did: string) => {
    const u = userById.get(did);
    return (u?.nickname ??
      u?.discord_username ??
      u?.discord_name ??
      did) as string;
  };

  // AoE2 Companion link captured in the legacy registration form (first wins).
  // Only applied to users we create; existing users are never modified.
  const aoe2UrlByUser = new Map<string, string>();
  for (const r of tpd) {
    const did = r.participantDiscordId as string | undefined;
    const url = (r.registration_form_data ?? {}).aoe2companion_link;
    if (
      did &&
      typeof url === "string" &&
      url.trim() &&
      !aoe2UrlByUser.has(did)
    ) {
      aoe2UrlByUser.set(did, url.trim());
    }
  }

  // ---- index -------------------------------------------------------
  const mpdByMatch = new Map<number, Row[]>();
  for (const r of mpd) push(mpdByMatch, Number(r.matchId), r);

  const gpdByGame = new Map<number, Row[]>();
  for (const r of gpd) push(gpdByGame, Number(r.gameId), r);

  const gamesByMatch = new Map<number, Row[]>();
  let droppedNullMapGames = 0;
  for (const g of games) {
    if (
      g.mapName === null ||
      g.mapName === undefined ||
      String(g.mapName).trim() === ""
    ) {
      droppedNullMapGames++;
      continue;
    }
    push(gamesByMatch, Number(g.matchId), g);
  }

  const groupUsersByGroup = new Map<number, Row[]>();
  for (const r of jGroupUsers)
    push(groupUsersByGroup, Number(r.tournamentGroupId), r);

  // ---- membership: participants per tournament ---------------------
  const participantsByT = new Map<number, Set<string>>();
  const tpdByTUser = new Map<string, Row>();
  const addP = (tid: number, did: string) => {
    if (!did) return;
    const s = participantsByT.get(tid) ?? new Set<string>();
    s.add(did);
    participantsByT.set(tid, s);
  };
  for (const r of jTourUsers) addP(Number(r.tournamentId), r.userDiscordId);
  for (const r of jTpd) {
    const row = tpdById.get(Number(r.tournamentParticipantDataId));
    if (!row) continue;
    tpdByTUser.set(`${r.tournamentId}:${row.participantDiscordId}`, row);
    addP(Number(r.tournamentId), row.participantDiscordId);
  }
  for (const r of jGroupUsers) {
    const g = groupById.get(Number(r.tournamentGroupId));
    if (g) addP(Number(g.belongsToId), r.userDiscordId);
  }
  for (const m of matches) {
    const g = groupById.get(Number(m.belongsToId));
    if (!g) continue;
    for (const p of mpdByMatch.get(Number(m.id)) ?? [])
      addP(Number(g.belongsToId), p.playerDiscordId);
  }

  // ---- included matches --------------------------------------------
  // A match is migrated only when it has exactly two players AND belongs to a
  // real group inside a real tournament. This guarantees scores are only ever
  // attached to a known group (there are no orphan / null-group matches).
  const includedMatches: Row[] = [];
  let droppedNon1v1 = 0;
  let droppedNoGroup = 0;
  for (const m of matches) {
    const players = mpdByMatch.get(Number(m.id)) ?? [];
    if (players.length !== 2) {
      droppedNon1v1++;
      continue;
    }
    const g = groupById.get(Number(m.belongsToId));
    if (!g || !tournamentById.has(Number(g.belongsToId))) {
      droppedNoGroup++;
      continue;
    }
    includedMatches.push(m);
  }

  // ---- build target rows -------------------------------------------
  const series: Array<{ id: string; name: string; displayOrder: number }> = [];
  const seriesSeen = new Set<string>();
  const seriesIdFor = (raw?: string | null) => {
    const name = raw?.trim() ? raw.trim() : "Legacy";
    // Reuse a series that already exists in the target (matched by name).
    const existingId = existingSeriesByName.get(name.toLowerCase());
    if (existingId) return existingId;
    const id = `ts_${slug(name)}`;
    if (!seriesSeen.has(id)) {
      seriesSeen.add(id);
      series.push({ id, name, displayOrder: series.length });
    }
    return id;
  };

  const tournamentRows: any[] = [];
  const sectionsToEnsure: Array<{
    tournamentId: string;
    slug: string;
    title: string;
    content: string;
    displayOrder: number;
  }> = [];
  for (const t of tournaments) {
    // All legacy tournaments are historical group tournaments: import them
    // already FINISHED and archived, so the app treats them as read-only.
    tournamentRows.push({
      id: `t_${t.id}`,
      urlKey: t.key,
      name: t.name,
      tournamentSeriesId: seriesIdFor(t.tournament_series),
      startDate: t.date_from ? new Date(t.date_from) : new Date(),
      endDate: t.date_to ? new Date(t.date_to) : null,
      isVisible: !!t.visible,
      archived: true,
      registrationClosed: true,
      format: "GROUP",
      registrationMode: "INDIVIDUAL",
      status: "FINISHED",
    });
    if (
      t.information_page_contents &&
      String(t.information_page_contents).trim()
    )
      sectionsToEnsure.push({
        tournamentId: `t_${t.id}`,
        slug: "information",
        title: "Informacje",
        content: t.information_page_contents,
        displayOrder: 0,
      });
    if (t.prizes_page_content && String(t.prizes_page_content).trim())
      sectionsToEnsure.push({
        tournamentId: `t_${t.id}`,
        slug: "prizes",
        title: "Nagrody",
        content: t.prizes_page_content,
        displayOrder: 1,
      });
  }

  const participantRows: any[] = [];
  const participantIdSet = new Set<string>();
  let nicknameSuffixes = 0;
  const usedMatchModes = new Map<number, any>();
  const modeIdFor = (n?: number | null) => {
    if (!n || !Number.isFinite(n) || n <= 0) return null;
    if (!usedMatchModes.has(n))
      usedMatchModes.set(n, { id: `mm_${n}`, gameCount: n, mode: "BEST_OF" });
    return `mm_${n}`;
  };

  for (const [tid, dids] of participantsByT) {
    const used = new Map<string, number>();
    for (const did of dids) {
      if (!userById.has(did)) continue;
      let nick = nickname(did);
      const n = (used.get(nick) ?? 0) + 1;
      used.set(nick, n);
      if (n > 1) {
        nick = `${nick} #${n}`;
        nicknameSuffixes++;
      }
      const uid = resolveUserId(did);
      const id = `p_${tid}_${uid}`;
      participantIdSet.add(id);
      const reg = tpdByTUser.get(`${tid}:${did}`);
      participantRows.push({
        id,
        tournamentId: `t_${tid}`,
        userId: uid,
        nickname: nick,
        status: "REGISTERED",
        registrationDate: reg?.registered_at
          ? new Date(reg.registered_at)
          : new Date(),
        registrationData: reg?.registration_form_data ?? undefined,
      });
    }
  }

  const groupRows: any[] = [];
  const groupTrRows: any[] = [];
  const groupParticipantRows: any[] = [];
  let groupIndex = 0;
  let rotationalGroups = 0;
  for (const g of groups) {
    if (!tournamentById.has(Number(g.belongsToId))) continue;
    const displayOrder = g.sort_key ?? groupIndex;
    const name = g.name ?? `Group ${g.id}`;
    const isRotational = ROTATION_EMOJI.test(name);
    if (isRotational) rotationalGroups++;
    groupRows.push({
      id: `g_${g.id}`,
      tournamentId: `t_${g.belongsToId}`,
      displayOrder,
      name,
      isRotational,
      matchModeId: modeIdFor(g.no_of_games),
      color: g.color ?? null,
    });
    if (g.rules_content && String(g.rules_content).trim())
      groupTrRows.push({
        id: `gtr_${g.id}_pl`,
        groupId: `g_${g.id}`,
        locale: "pl",
        description: g.rules_content,
      });
    (groupUsersByGroup.get(Number(g.id)) ?? []).forEach((m, i) => {
      const uid = resolveUserId(m.userDiscordId);
      const pid = `p_${g.belongsToId}_${uid}`;
      if (!participantIdSet.has(pid)) return;
      groupParticipantRows.push({
        id: `gpp_${g.id}_${uid}`,
        tournamentGroupId: `g_${g.id}`,
        tournamentParticipantId: pid,
        displayOrder: i,
      });
    });
    groupIndex++;
  }

  const matchRows: any[] = [];
  const matchParticipantRows: any[] = [];
  const gameRows: any[] = [];
  const gameParticipantRows: any[] = [];
  const usedCivs = new Map<string, string>();
  const usedMaps = new Map<string, string>();
  const unmappedCivs = new Set<string>();
  const customMaps = new Set<string>();

  for (const m of includedMatches) {
    const g = groupById.get(Number(m.belongsToId))!;
    const t = tournamentById.get(Number(g.belongsToId))!;
    const players = mpdByMatch.get(Number(m.id))!;
    const status = m.is_admin_confirmed
      ? "ADMIN_APPROVED"
      : m.is_played
        ? "COMPLETED"
        : m.scheduled_timestamp
          ? "SCHEDULED"
          : "PENDING";
    const modeId = modeIdFor(g.no_of_games);
    matchRows.push({
      id: `m_${m.id}`,
      groupId: `g_${g.id}`,
      tournamentMatchModeId: modeId,
      matchDate: m.scheduled_timestamp ? new Date(m.scheduled_timestamp) : null,
      civDraftKey: "",
      mapDraftKey: "",
      status,
      bestOf: g.no_of_games && g.no_of_games > 0 ? g.no_of_games : null,
    });

    const mpIdSet = new Set<string>();
    for (const p of players) {
      const uid = resolveUserId(p.playerDiscordId);
      const pid = `p_${t.id}_${uid}`;
      if (!participantIdSet.has(pid)) continue;
      const other = players.find(
        (x) => x.playerDiscordId !== p.playerDiscordId,
      );
      const mpid = `mp_${m.id}_${uid}`;
      mpIdSet.add(mpid);
      matchParticipantRows.push({
        id: mpid,
        matchId: `m_${m.id}`,
        participantId: pid,
        wonScore: p.score ?? 0,
        lostScore: other?.score ?? 0,
        isWinner: !!p.set_winner || !!p.had_admin_win,
      });
    }

    for (const game of gamesByMatch.get(Number(m.id)) ?? []) {
      const resolved = resolveMap(game.mapName);
      if (!resolved) continue;
      usedMaps.set(resolved.id, resolved.name);
      if (resolved.custom) customMaps.add(resolved.name);
      const gid = `game_${game.id}`;
      gameRows.push({
        id: gid,
        matchId: `m_${m.id}`,
        mapId: resolved.id,
        recUrl: game.recordingUrl ?? null,
      });
      for (const gp of gpdByGame.get(Number(game.id)) ?? []) {
        const mpid = `mp_${m.id}_${resolveUserId(gp.userDiscordId)}`;
        if (!mpIdSet.has(mpid)) continue;
        const civ = resolveCiv(gp.civilization);
        if (civ) usedCivs.set(civ.id, civ.name);
        else if (gp.civilization && String(gp.civilization).trim())
          unmappedCivs.add(String(gp.civilization).trim());
        gameParticipantRows.push({
          // Deterministic id: GameParticipant has no natural unique key, so a
          // stable id is what keeps re-runs idempotent (skipDuplicates).
          id: `gp_${game.id}_${mpid}`,
          gameId: gid,
          civId: civ?.id ?? null,
          isWinner: !!gp.winner,
          matchParticipantId: mpid,
        });
      }
    }
  }

  // ---- report ------------------------------------------------------
  // A legacy user maps to an existing new-DB user when their Discord account
  // is already linked (Account.providerAccountId); otherwise they are created
  // with id = discord_id.
  const matchedExisting = users.filter((u) =>
    discordToUserId.has(u.discord_id as string),
  ).length;
  const usersToCreate = users.filter((u) => {
    const did = u.discord_id as string;
    return !discordToUserId.has(did) && !existingUserIds.has(did);
  });
  const newUsers = usersToCreate.length;

  console.log("SOURCE");
  console.log(`  users             : ${users.length}`);
  console.log(`  tournaments       : ${tournaments.length}`);
  console.log(`  groups            : ${groups.length}`);
  console.log(
    `  matches           : ${matches.length} (kept: ${includedMatches.length}, dropped non-2-player: ${droppedNon1v1}, dropped no-group: ${droppedNoGroup})`,
  );
  console.log(
    `  games             : ${games.length} (kept: ${gameRows.length}, dropped null-map: ${droppedNullMapGames})`,
  );
  console.log("");
  console.log("TARGET (rows to create)");
  console.log(`  TournamentSeries  : ${series.length}`);
  console.log(`  Tournament        : ${tournamentRows.length}`);
  console.log(`  Sections          : ${sectionsToEnsure.length}`);
  console.log(
    `  Participant       : ${participantRows.length} (nickname suffix fixes: ${nicknameSuffixes})`,
  );
  console.log(
    `  Group             : ${groupRows.length} (+ ${groupParticipantRows.length} members, rotational: ${rotationalGroups})`,
  );
  console.log(
    `  Match             : ${matchRows.length} (+ ${matchParticipantRows.length} players)`,
  );
  console.log(
    `  Game              : ${gameRows.length} (+ ${gameParticipantRows.length} players)`,
  );
  console.log(`  Civ               : ${usedCivs.size}`);
  console.log(
    `  Map               : ${usedMaps.size} (custom: ${customMaps.size})`,
  );
  console.log(
    `  Users             : new ${newUsers} / matched to existing account ${matchedExisting} (existing left untouched)`,
  );
  console.log(`  AoE2 Companion links carried over: ${aoe2UrlByUser.size}`);
  if (unmappedCivs.size)
    console.log(`\n  !! unmapped civs: ${[...unmappedCivs].join(", ")}`);
  if (customMaps.size)
    console.log(
      `\n  custom maps (no image in civ-data): ${[...customMaps].sort().join(", ")}`,
    );

  // ---- write -------------------------------------------------------
  if (!COMMIT) {
    console.log(
      "\nDRY-RUN — nothing written. Re-run with --commit to apply.\n",
    );
    return;
  }

  console.log("\nWriting…");
  await insertMany(
    prisma.civ,
    [...usedCivs].map(([id, name]) => ({ id, name })),
  );
  await insertMany(
    prisma.baseMap,
    [...usedMaps].map(([id, name]) => ({ id, name })),
  );
  await insertMany(
    prisma.map,
    [...usedMaps].map(([id, name]) => ({ id, name, baseMapId: id })),
  );
  await insertMany(
    prisma.user,
    usersToCreate.map((u) => ({
      id: u.discord_id,
      name: u.nickname ?? u.discord_username ?? u.discord_name ?? null,
      image: u.discord_avatar ?? null,
      color: u.color ?? null,
      adminComment: u.admin_comment ?? null,
      streamUrl: u.stream_link ?? null,
      aoe2companionUrl: aoe2UrlByUser.get(u.discord_id as string) ?? null,
    })),
  );
  await insertMany(prisma.tournamentSeries, series);
  await insertMany(prisma.tournamentMatchMode, [...usedMatchModes.values()]);
  await insertMany(prisma.tournament, tournamentRows);
  for (const s of sectionsToEnsure) await ensureSection(s);
  await insertMany(prisma.tournamentParticipant, participantRows);
  await insertMany(prisma.tournamentGroup, groupRows);
  await insertMany(prisma.tournamentGroupTranslation, groupTrRows);
  await insertMany(prisma.tournamentGroupParticipant, groupParticipantRows);
  await insertMany(prisma.tournamentMatch, matchRows);
  await insertMany(prisma.tournamentMatchParticipant, matchParticipantRows);
  await insertMany(prisma.game, gameRows);
  await insertMany(prisma.gameParticipant, gameParticipantRows);

  console.log("Done.\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.all([prisma.$disconnect(), old.end().catch(() => {})]);
  });
