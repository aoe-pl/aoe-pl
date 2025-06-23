"use client";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import type { ExtendedTournamentMatch } from "./match";
import { TournamentGameForm } from "./tournament-game-form";

interface GameManagementProps {
  match: ExtendedTournamentMatch;
  isOpen: boolean;
  onClose: () => void;
  matchMode: { id: string; mode: string; gameCount: number };
}

export function GameManagement({
  match,
  isOpen,
  onClose,
  matchMode,
}: GameManagementProps) {
  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Manage Games for Match</DrawerTitle>
          <DrawerDescription>
            Add, update, and review games for this match. Changes can affect
            match score and winner.
          </DrawerDescription>
        </DrawerHeader>
        <TournamentGameForm
          match={match}
          onCancel={onClose}
          matchMode={matchMode}
        />
      </DrawerContent>
    </Drawer>
  );
}
