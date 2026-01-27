interface Aoe2Player {
  leaderboardId: string;
  profileId: number;
  name: string;
  rank: number;
  rating: number;
  country: string;
  wins: number;
  losses: number;
  games: number;
  streak: number;
}

interface Aoe2LeaderboardResponse {
  players: Aoe2Player[];
  total: number;
  page: number;
  perPage: number;
}

export async function getTopPolishPlayers(count = 10): Promise<Aoe2Player[]> {
  const polishPlayers: Aoe2Player[] = [];
  const maxPages = 20;
  
  let page = 1;

  while (polishPlayers.length < count && page <= maxPages) {
    try {
      const response = await fetch(
        `https://data.aoe2companion.com/api/leaderboards/rm_1v1?search=&language=en&page=${page}`,
        { 
          next: { revalidate: 3600 }, // Cache for 1h
          headers: {
            'User-Agent': 'AoE2PL/1.0',
          },
        }
      );

      if (!response.ok) {
        console.error(`Failed to fetch leaderboard page: ${response.status} ${response.statusText}`);
        
        break;
      }

      const data = await response.json() as Aoe2LeaderboardResponse;
      const polishFromPage = data.players.filter(p => p.country === 'pl');

      polishPlayers.push(...polishFromPage);

      page++;
      
      if (polishFromPage.length === 0) {
        continue;
      }

    } catch (error) {
      console.error(`Error fetching leaderboard page:`, error);
      break;
    }
  }

  return polishPlayers.slice(0, count);
}

export type { Aoe2Player };
