import Link from "next/link";

export function PlayerLink({
  playerNumber,
  name,
}: {
  playerNumber: number | undefined;
  name: string;
}) {
  if (playerNumber === undefined) return <span>{name}</span>;
  return (
    <Link
      href={`/players/${playerNumber}`}
      className="hover:underline"
    >
      {name}
    </Link>
  );
}
