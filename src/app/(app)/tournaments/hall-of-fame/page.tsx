import { HallOfFameContent } from "@/components/tournaments/hall-of-fame/hall-of-fame-content";
import { getHallOfFame } from "@/lib/helpers/tournament-hall-of-fame";

export default async function HallOfFamePage() {
  const data = await getHallOfFame();

  return <HallOfFameContent data={data} />;
}
