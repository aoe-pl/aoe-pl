"use client";

import { PlayerLink } from "@/components/player-link";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { tournamentParticipantRepository } from "@/lib/repositories/tournamentParticipantRepository";
import { isBrightColor } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

type TournamentParticipants = Awaited<
  ReturnType<typeof tournamentParticipantRepository.getTournamentParticipants>
>;

type SortKey =
  | "name-asc"
  | "name-desc"
  | "rating-desc"
  | "rating-asc"
  | "group";

interface TournamentPlayerListProps {
  tournamentParticipants: TournamentParticipants;
}

/**
 * The group a player should be sorted under. Rotational groups mirror a real
 * group, so a non-rotational group is preferred when the player is in both.
 */
function getPrimaryGroup(
  player: TournamentParticipants[number],
  locale: string,
) {
  const groups = [...player.TournamentGroupParticipant].sort(
    (a, b) =>
      Number(a.tournamentGroup.isRotational) -
        Number(b.tournamentGroup.isRotational) ||
      a.tournamentGroup.displayOrder - b.tournamentGroup.displayOrder ||
      a.tournamentGroup.name.localeCompare(b.tournamentGroup.name, locale),
  );

  return groups[0]?.tournamentGroup;
}

export function TournamentPlayerList({
  tournamentParticipants,
}: TournamentPlayerListProps) {
  const t = useTranslations("tournament.players");
  const locale = useLocale();
  const [sort, setSort] = useState<SortKey>("rating-desc");

  const players = useMemo(() => {
    return [...tournamentParticipants].sort((a, b) => {
      const nameComparison = a.nickname.localeCompare(b.nickname, locale);

      if (sort === "name-asc" || sort === "name-desc") {
        return sort === "name-asc" ? nameComparison : -nameComparison;
      }

      if (sort === "group") {
        const groupA = getPrimaryGroup(a, locale);
        const groupB = getPrimaryGroup(b, locale);

        // Players without a group always go last.
        if (!groupA && !groupB) return nameComparison;
        if (!groupA) return 1;
        if (!groupB) return -1;

        const displayOrderComparison =
          groupA.displayOrder - groupB.displayOrder;

        if (displayOrderComparison !== 0) return displayOrderComparison;

        const groupNameComparison = groupA.name.localeCompare(
          groupB.name,
          locale,
        );

        return groupNameComparison === 0 ? nameComparison : groupNameComparison;
      }

      const ratingA = a.user?.rating ?? null;
      const ratingB = b.user?.rating ?? null;

      // Players without a rating always go last, regardless of direction.
      if (ratingA === null && ratingB === null) return nameComparison;
      if (ratingA === null) return 1;
      if (ratingB === null) return -1;

      const ratingComparison = ratingA - ratingB;

      return ratingComparison === 0
        ? nameComparison
        : sort === "rating-desc"
          ? -ratingComparison
          : ratingComparison;
    });
  }, [tournamentParticipants, sort, locale]);

  if (!tournamentParticipants.length) {
    return <span>{t("no_players")}</span>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select
          value={sort}
          onValueChange={(value) => setSort(value as SortKey)}
        >
          <SelectTrigger
            className="w-56"
            aria-label={t("sort.label")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">{t("sort.name_asc")}</SelectItem>
            <SelectItem value="name-desc">{t("sort.name_desc")}</SelectItem>
            <SelectItem value="rating-desc">{t("sort.rating_desc")}</SelectItem>
            <SelectItem value="rating-asc">{t("sort.rating_asc")}</SelectItem>
            <SelectItem value="group">{t("sort.group")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">{t("nickname")}</TableHead>
            <TableHead className="w-[100px]">{t("rating")}</TableHead>
            <TableHead className="w-[100px]">{t("max_rating")}</TableHead>
            <TableHead>{t("in_groups")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player) => (
            <TableRow key={player.id}>
              <TableCell className="font-medium">
                <PlayerLink
                  playerNumber={player.user?.playerNumber}
                  name={player.nickname}
                />
              </TableCell>
              <TableCell className="font-medium">
                {player.user?.rating ?? "-"}
              </TableCell>
              <TableCell className="font-medium">
                {player.user?.maxRating ?? "-"}
              </TableCell>
              <TableCell className="flex gap-1">
                {player.TournamentGroupParticipant.map((gp) => (
                  <Badge
                    key={gp.id}
                    className="text-sm"
                    style={{
                      backgroundColor: gp.tournamentGroup.color!,
                      color: isBrightColor(gp.tournamentGroup.color!)
                        ? "#000"
                        : "#fff",
                    }}
                  >
                    {gp.tournamentGroup.name}
                  </Badge>
                ))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
