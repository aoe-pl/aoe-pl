import "server-only";

import { env } from "@/env";
import { slugify } from "@/lib/utils";
import { db } from "@/server/db";

const requestTImeoutMs = 5000;
const embedColor = 0xc8a04b;
const cancelColor = 0x973434;

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  fields?: DiscordEmbedField[];
  timestamp?: string;
  footer?: { text: string };
}

export interface DiscordWebhookPayload {
  content?: string;
  username?: string;
  embeds?: DiscordEmbed[];
}

/**
 * POSTs a payload to the configured Discord webhook.
 */
export async function sendDiscordWebhook(
  payload: DiscordWebhookPayload,
): Promise<void> {
  const webhookUrl = env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTImeoutMs);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(
        `Discord webhook failed: ${response.status} ${response.statusText}`,
      );
    }
  } catch (error) {
    console.error("Error sending Discord webhook:", error);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Formats a date as a Discord timestamp (e.g. `<t:1790860980:F>`), which every
 * viewer sees rendered in their own local timezone.
 */
function discordTimestamp(date: Date, style: "f" | "F" | "R" = "F"): string {
  return `<t:${Math.floor(date.getTime() / 1000)}:${style}>`;
}

/**
 * Normalises the configured site URL into an absolute URL with a scheme.
 */
function resolveSiteUrl(raw: string | undefined): string | undefined {
  const trimmed = raw?.replace(/\/+$/, "");
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const scheme = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)([:/]|$)/i.test(trimmed)
    ? "http"
    : "https";

  return `${scheme}://${trimmed}`;
}

/** Human-readable name of one side of a match (team name or player nickname). */
function sideName(participant: {
  team: { name: string } | null;
  participant: { nickname: string } | null;
}): string {
  return participant.team?.name ?? participant.participant?.nickname ?? "TBD";
}

/** Everything needed to render a match notification. */
interface MatchNotificationContext {
  tournamentName: string | null;
  matchup: string;
  groupName: string | null;
  matchDate: Date | null;
  url: string | undefined;
}

/** Loads a match and derives the values shared by all match notifications. */
async function loadMatchNotificationContext(
  matchId: string,
): Promise<MatchNotificationContext | null> {
  const match = await db.tournamentMatch.findUnique({
    where: { id: matchId },
    include: {
      TournamentMatchParticipant: {
        include: { participant: true, team: true },
      },
      group: {
        include: { tournament: { include: { tournamentSeries: true } } },
      },
      bracketNodes: {
        include: {
          bracket: {
            include: { tournament: { include: { tournamentSeries: true } } },
          },
        },
      },
    },
  });

  if (!match) return null;

  const tournament =
    match.group?.tournament ?? match.bracketNodes[0]?.bracket.tournament;

  const sides = match.TournamentMatchParticipant.map(sideName);
  const matchup = sides.length > 0 ? sides.join(" vs ") : "TBD";

  const siteUrl = resolveSiteUrl(env.SITE_URL);
  const url =
    siteUrl && tournament
      ? `${siteUrl}/tournaments/${slugify(
          tournament.tournamentSeries?.name ?? "",
        )}/${tournament.urlKey}/matches/${match.matchNumber}`
      : undefined;

  return {
    tournamentName: tournament?.name ?? null,
    matchup,
    groupName: match.group?.name ?? null,
    matchDate: match.matchDate,
    url,
  };
}

/** The matchup, rendered as a link to the match page when a URL is available. */
function matchupLine(matchup: string, url: string | undefined): string {
  return url ? `[**${matchup}**](${url})` : `**${matchup}**`;
}

/** Only group matches show a group; bracket matches have no stage label. */
function matchFields(groupName: string | null): DiscordEmbedField[] {
  return groupName ? [{ name: "Grupa", value: groupName, inline: true }] : [];
}

/**
 * Sends a Discord notification announcing that a tournament match has been
 * scheduled (or rescheduled). Safe to call even when no webhook is configured.
 */
export async function notifyMatchScheduled(matchId: string): Promise<void> {
  if (!env.DISCORD_WEBHOOK_URL) return;

  try {
    const context = await loadMatchNotificationContext(matchId);

    if (!context) return;

    const description = [matchupLine(context.matchup, context.url)];

    if (context.matchDate) {
      description.push(
        `${discordTimestamp(context.matchDate, "F")} (${discordTimestamp(
          context.matchDate,
          "R",
        )})`,
      );
    }

    await sendDiscordWebhook({
      embeds: [
        {
          title: context.tournamentName ?? "Zaplanowano mecz",
          description: description.join("\n"),
          color: embedColor,
          fields: matchFields(context.groupName),
        },
      ],
    });
  } catch (error) {
    console.error("Error building Discord match notification:", error);
  }
}

/**
 * Sends a Discord notification announcing that a scheduled match has been
 * cancelled. Safe to call even when no webhook is configured.
 */
export async function notifyMatchUnscheduled(matchId: string): Promise<void> {
  if (!env.DISCORD_WEBHOOK_URL) return;

  try {
    const context = await loadMatchNotificationContext(matchId);

    if (!context) return;

    await sendDiscordWebhook({
      embeds: [
        {
          title: context.tournamentName ?? "Mecz anulowany",
          description: [
            matchupLine(context.matchup, context.url),
            "Mecz anulowany",
          ].join("\n"),
          color: cancelColor,
          fields: matchFields(context.groupName),
        },
      ],
    });
  } catch (error) {
    console.error("Error building Discord match notification:", error);
  }
}
