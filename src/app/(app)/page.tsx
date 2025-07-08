import { MatchSchedule } from "@/components/match-schedule";
import { Button } from "@/components/ui/button";
import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import { Calendar, Crown } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlayerRanking } from "@/components/player-ranking";

const topPlayers = [
  { rank: 1, nickname: "TheViper_PL", mmr: 2350, maxMmr: 2400, trend: "up" },
  { rank: 2, nickname: "DauT_Polska", mmr: 2200, maxMmr: 2250, trend: "down" },
  { rank: 3, nickname: "JorDan_PL", mmr: 2150, maxMmr: 2200, trend: "stable" },
  { rank: 4, nickname: "MbL_Warszawa", mmr: 2100, maxMmr: 2150, trend: "up" },
  { rank: 5, nickname: "Hera_Kraków", mmr: 2050, maxMmr: 2100, trend: "down" },
  { rank: 6, nickname: "Liereyy_PL", mmr: 2000, maxMmr: 2050, trend: "up" },
  {
    rank: 7,
    nickname: "TaToH_Gdańsk",
    mmr: 1950,
    maxMmr: 2000,
    trend: "stable",
  },
  {
    rank: 8,
    nickname: "Villese_Poznań",
    mmr: 1900,
    maxMmr: 1950,
    trend: "down",
  },
  { rank: 9, nickname: "Nicov_Wrocław", mmr: 1850, maxMmr: 1900, trend: "up" },
  { rank: 10, nickname: "ACCM_Łódź", mmr: 1800, maxMmr: 1850, trend: "stable" },
];

const todayMatches = [
  {
    id: "1",
    player1: "TheViper_PL",
    player2: "DauT_Polska",
    time: "18:00",
    group: { name: "Master of Ants", color: "gold" },
    isLive: true,
  },
  {
    id: "2",
    player1: "JorDan_PL",
    player2: "MbL_Warszawa",
    time: "19:00",
    group: { name: "Master of Ants", color: "gold" },
  },
  {
    id: "3",
    player1: "Hera_Kraków",
    player2: "Liereyy_PL",
    time: "20:00",
    group: { name: "Gold Ants", color: "amber" },
  },
  {
    id: "4",
    player1: "TaToH_Gdańsk",
    player2: "Villese_Poznań",
    time: "21:00",
    group: { name: "Red Ants 1", color: "red" },
  },
];

export default async function Home() {
  const hello = await api.test.hello({ text: "from tRPC" });

  const session = await auth();
  return (
    <HydrateClient>
      <main className="mt-8 grid gap-8 px-16 md:grid-cols-2 lg:grid-cols-3">
        <div className="col-span-full flex flex-col gap-4 lg:col-span-2">
          <h1 className="text-3xl font-semibold">
            Polska Liga Age of Empires 2
          </h1>
          <div className="flex flex-col rounded-xl border-1 border-blue-200 bg-blue-50 p-4">
            <Calendar color="blue" />
            <h3 className="font-medium">
              Trwa rejestracja do Ant League 2025!
            </h3>
            <span>
              Zapisz się do najważniejszej ligi Age of Empires 2 w Polsce.
              Rejestracja trwa do 30 kwietnia.
            </span>
            <span className="mt-1 text-gray-700">Pozostało 10 dni</span>
            <Button className="mt-3">Zarejestruj się</Button>
          </div>
          <div>
            <MatchSchedule
              date="dzisiaj"
              matches={todayMatches}
            />
          </div>
          <div className="flex flex-col gap-2">
            <h3>Warto obejrzec</h3>
            <div className="h-[750px] bg-black">FIlmik placeholder</div>
          </div>
        </div>
        <div className="col-span-full lg:col-span-1">
          <Card className="gap-0 py-0">
            <CardHeader className="bg-amber-50 py-4 dark:bg-amber-950">
              <CardTitle className="flex items-center">
                <Crown className="mr-2 h-5 w-5 text-amber-600" />
                Top 10 graczy w Polsce
              </CardTitle>
              <CardDescription>Ranking na podstawie MMR</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <PlayerRanking players={topPlayers} />
            </CardContent>
          </Card>
        </div>
      </main>
    </HydrateClient>
  );
}
