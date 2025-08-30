"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  User, 
  Mail, 
  Trophy, 
  Video,
  ExternalLink
} from "lucide-react";
import type { User as UserType, UserRole, Role, UserStream, Platform, TournamentParticipant } from "@prisma/client";

type UserWithDetails = UserType & {
  userRoles: (UserRole & { role: Role })[];
  userStreams: (UserStream & { platform: Platform })[];
  TournamentParticipant: (TournamentParticipant & {
    tournament: {
      id: string;
      name: string;
      status: string;
    };
  })[];
  _count: {
    TournamentParticipant: number;
    userRoles: number;
    userStreams: number;
  };
};

interface UserDetailViewProps {
  user: UserWithDetails;
}

export function UserDetailView({ user }: UserDetailViewProps) {

  const formatDate = (date: Date | null) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString();
  };

  return (
    <ScrollArea className="h-[70vh] px-4">
      <div className="space-y-6 p-6">
        {/* User Basic Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <User className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>
                  {user.name ?? "No Name"}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  {user.email ?? "No Email"}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {user.color && (
              <div>
                <div className="text-sm font-medium">Color</div>
                <div className="flex items-center gap-2">
                  <div 
                    className="h-4 w-4 rounded border"
                    style={{ backgroundColor: user.color }}
                  />
                  <span className="text-sm">{user.color}</span>
                </div>
              </div>
            )}
            
            {user.adminComment && (
              <div>
                <div className="text-sm font-medium">Admin Comment</div>
                <div className="mt-1 rounded border p-3 text-sm">
                  {user.adminComment}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Roles - will be managed separately */}

        {/* Streams */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Streaming Platforms ({user._count.userStreams})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.userStreams.length > 0 ? (
              <div className="space-y-2">
                {user.userStreams.map((stream) => (
                  <div key={stream.id} className="flex items-center justify-between rounded border p-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">
                        {stream.platform.name}
                      </Badge>
                      <span className="text-sm">{stream.platform.type}</span>
                    </div>
                    {stream.platform.urlTemplate && (
                      <Button variant="ghost" size="sm" asChild>
                        <a 
                          href={stream.platform.urlTemplate} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No streaming platforms configured</p>
            )}
          </CardContent>
        </Card>


        {/* Tournament Participations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Tournament Participations ({user._count.TournamentParticipant})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.TournamentParticipant.length > 0 ? (
              <div className="rounded border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tournament</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Registration Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user.TournamentParticipant.map((participation) => (
                      <TableRow key={participation.id}>
                        <TableCell>
                          <Button variant="link" className="h-auto p-0" asChild>
                            <a href={`/admin/tournaments/${participation.tournament.id}`}>
                              {participation.tournament.name}
                            </a>
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              participation.tournament.status === "ACTIVE" 
                                ? "default" 
                                : "secondary"
                            }
                          >
                            {participation.tournament.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(participation.registrationDate)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tournament participations</p>
            )}
            
            {user._count.TournamentParticipant > user.TournamentParticipant.length && (
              <p className="mt-2 text-xs text-muted-foreground">
                Showing {user.TournamentParticipant.length} of {user._count.TournamentParticipant} participations
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}