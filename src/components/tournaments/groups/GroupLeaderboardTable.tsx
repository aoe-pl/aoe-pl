import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Props {
  group: string | null;
}

export function GroupLeaderboardTable({ group }: Props) {
  return (
    <Card className="w-full text-center">
      <CardHeader>
        <CardTitle>Group Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="[&>th]:text-center">
              <TableHead>Rank</TableHead>
              <TableHead>Player</TableHead>
              <TableHead>Games Played</TableHead>
              <TableHead>Games Won</TableHead>
              <TableHead>Games Lost</TableHead>
              <TableHead>Total Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>1</TableCell>
              <TableCell>abc</TableCell>
              <TableCell>1</TableCell>
              <TableCell>1</TableCell>
              <TableCell>0</TableCell>
              <TableCell>3</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
