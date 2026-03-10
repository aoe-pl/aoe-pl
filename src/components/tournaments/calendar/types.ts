export enum CalendarMatchStatus {
  Scheduled = "scheduled",
  Ongoing = "ongoing",
  Completed = "completed",
}

export interface CalendarGroup {
  id: string;
  name: string;
  color: string;
}

export interface CalendarPlayer {
  id: string;
  nickname: string;
}

export interface CalendarMatch {
  id: string;
  groupId: string;
  date: Date;
  player1Id: string;
  player2Id: string;
  status: CalendarMatchStatus;
  isStreamed?: boolean;
  isVerified?: boolean;
}
