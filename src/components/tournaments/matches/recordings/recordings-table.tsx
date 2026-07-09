import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ParsedRecording } from "@/lib/recording-parser/types";

interface RecordingsTableProps {
  recordings: ParsedRecording[];
}

export function RecordingsTable({ recordings }: RecordingsTableProps) {
  return (
    <div className="w-xl rounded-md border">
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
          {recordings.map((r, i) => (
            <TableRow key={i}>
              <TableCell>
                {r.player1Data.name} - {r.player1Data.civ}
              </TableCell>
              <TableCell>
                {r.player2Data.name} - {r.player2Data.civ}
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
