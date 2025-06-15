import { api } from "@/trpc/server";

type TournamentParticipantsProps = {
  tournamentId: string;
};

export async function TournamentParticipants({
  tournamentId,
}: TournamentParticipantsProps) {
  const participants = await api.tournaments.participants.list({
    tournamentId,
    includeUser: true,
  });

  return (
    <div>
      <h2 className="text-lg font-semibold">Participants</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {participants.map((participant) => (
          <div key={participant.id}>{participant.nickname}</div>
        ))}
      </div>
    </div>
  );
}
