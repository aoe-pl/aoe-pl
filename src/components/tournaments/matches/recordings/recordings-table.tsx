import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ParsedRecording } from "./types";

// example data to show players what the table will look like before they upload any recordings
const exampleRecord: ParsedRecording[] = [
  {
    fileName: "example_game1.aoe2record",
    player1: "PlayerOne",
    player2: "PlayerTwo",
    civ1: "Britons",
    civ2: "Franks",
    map: "Arabia",
    length: "13:37",
    date: "2026-06-15",
    winner: 1,
    guid: "example-guid",
    restored: false,
  },
];

interface RecordingsTableProps {
  recordings: ParsedRecording[];
  showExample: boolean;
}

export function RecordingsTable({
  recordings,
  showExample,
}: RecordingsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Player 1</TableHead>
            <TableHead>Player 2</TableHead>
            <TableHead>Map</TableHead>
            <TableHead>Length</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recordings.length === 0 && !showExample && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-muted-foreground py-6 text-center text-sm"
              >
                No recordings uploaded yet.
              </TableCell>
            </TableRow>
          )}

          {recordings.length === 0 &&
            showExample &&
            exampleRecord.map((r, i) => (
              <TableRow
                key={i}
                className="italic opacity-40"
              >
                <TableCell>
                  {r.player1} - {r.civ1}
                </TableCell>
                <TableCell>
                  {r.player2} - {r.civ2}
                </TableCell>
                <TableCell>{r.map}</TableCell>
                <TableCell>{r.length}</TableCell>
                <TableCell>{r.date}</TableCell>
              </TableRow>
            ))}

          {recordings.map((r, i) => (
            <TableRow key={i}>
              <TableCell>
                {r.player1} - {r.civ1}
              </TableCell>
              <TableCell>
                {r.player2} - {r.civ2}
              </TableCell>
              <TableCell>{r.map}</TableCell>
              <TableCell>{r.length}</TableCell>
              <TableCell>{r.date}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
