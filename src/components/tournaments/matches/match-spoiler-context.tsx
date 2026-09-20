"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface MatchSpoilerContextValue {
  /** Whether the score/details should currently be visible. */
  revealed: boolean;
  /** Whether the match is admin approved (makes the score permanently visible). */
  isApproved: boolean;
  /** Toggle the per-viewer reveal state. */
  toggle: () => void;
}

const MatchSpoilerContext = createContext<MatchSpoilerContextValue | null>(
  null,
);

interface MatchSpoilerProviderProps {
  /**
   * When true (match status is ADMIN_APPROVED) the score is always revealed and
   * the viewer cannot cover it again.
   */
  isApproved: boolean;
  children: ReactNode;
}

/**
 * Holds the per-viewer "reveal scores" state. The state is intentionally not
 * persisted: by default results stay hidden and are only uncovered when the
 * match is approved or the viewer reveals them for the current session.
 */
export function MatchSpoilerProvider({
  isApproved,
  children,
}: MatchSpoilerProviderProps) {
  const [userRevealed, setUserRevealed] = useState(false);

  const value = useMemo<MatchSpoilerContextValue>(
    () => ({
      revealed: isApproved || userRevealed,
      isApproved,
      toggle: () => setUserRevealed((previous) => !previous),
    }),
    [isApproved, userRevealed],
  );

  return (
    <MatchSpoilerContext.Provider value={value}>
      {children}
    </MatchSpoilerContext.Provider>
  );
}

export function useMatchSpoiler(): MatchSpoilerContextValue {
  const context = useContext(MatchSpoilerContext);

  if (!context) {
    throw new Error(
      "useMatchSpoiler must be used within a MatchSpoilerProvider",
    );
  }

  return context;
}
