"use client";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ErrorToast } from "@/components/ui/error-toast-content";
import {
  getLoserDropTarget,
  log2,
} from "@/lib/tournaments/match-generation/bracket-matches";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import {
  DoubleEliminationBracket,
  SingleEliminationBracket,
  SVGViewer,
  type CommonTreeProps,
  type MatchComponentProps,
  type MatchType,
} from "@g-loot/react-tournament-brackets/dist/esm";
import { Trophy } from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
import { toast } from "sonner";
import type { ExtendedTournamentMatch } from "./groups-detail/match";
import type { TournamentMatchFormSchema } from "./tournament";
import { TournamentMatchForm } from "./tournament-match-form";

const BOX_WIDTH = 200;
const BOX_HEIGHT = 100;

type BracketParticipant = {
  id: string;
  name?: string;
  isWinner?: boolean;
  wonScore: number;
  lostScore: number;
};

type BracketMatch = {
  id: string;
  nextMatchId: string | null;
  nextLooserMatchId?: string;
  tournamentRoundText?: string;
  startTime: string;
  state: string;
  participants: BracketParticipant[];
  matchId: string | null;
  isWinnerBracket: boolean;
  round: number;
  isGrandFinal: boolean;
  onSelect: (matchId: string) => void;
};

function participantLabel(p: BracketParticipant): string {
  return p.name ?? "TBD";
}

function MatchCard({ match }: MatchComponentProps) {
  const data = match as unknown as BracketMatch;
  const participants = data.participants;
  const isDecided = participants.some((p) => p.isWinner);

  return (
    <div
      className={cn(
        "bg-card h-full w-full overflow-hidden rounded-lg border shadow-sm transition-shadow",
        data.matchId && "cursor-pointer hover:shadow-lg",
        data.isGrandFinal
          ? "border-amber-400/70 ring-1 ring-amber-400/40"
          : !data.isWinnerBracket && "border-dashed border-rose-300/70",
        isDecided && "border-emerald-500/50",
      )}
      onClick={() => data.matchId && data.onSelect(data.matchId)}
    >
      <div
        className={cn(
          "flex items-center gap-1 border-b px-2 py-1 text-[10px] font-medium tracking-wide uppercase",
          data.isGrandFinal
            ? "bg-amber-400/15 text-amber-600 dark:text-amber-400"
            : data.isWinnerBracket
              ? "bg-primary/10 text-primary"
              : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
        )}
      >
        {data.isGrandFinal && <Trophy className="h-3 w-3" />}
        {data.isGrandFinal
          ? "Grand Final"
          : data.isWinnerBracket
            ? `WB · Round ${data.round}`
            : `LB · Round ${data.round}`}
      </div>
      <div className="divide-y">
        {participants.length === 0 && (
          <div className="text-muted-foreground px-2 py-2.5 text-xs italic">
            TBD
          </div>
        )}
        {participants.map((p) => (
          <div
            key={p.id}
            className={cn(
              "flex items-center justify-between gap-2 px-2 py-1.5 text-xs",
              p.isWinner
                ? "bg-emerald-500/10 font-semibold text-emerald-700 dark:text-emerald-400"
                : isDecided && "text-muted-foreground",
            )}
          >
            <span className="flex min-w-0 items-center gap-1">
              {p.isWinner && (
                <Trophy className="h-3 w-3 shrink-0 text-emerald-500" />
              )}
              <span className="truncate">{participantLabel(p)}</span>
            </span>
            <span
              className={cn(
                "shrink-0 rounded px-1.5 py-0.5 text-[11px] tabular-nums",
                p.isWinner
                  ? "bg-emerald-500/20"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {p.wonScore}-{p.lostScore}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function useContainerSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 800, height: 500 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, size };
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/**
 * Scales the bracket SVG to fill the container while keeping its aspect
 * ratio, so the whole bracket is always visible. The library's own SVGViewer
 * only sizes its viewport to min(container, bracket size), which leaves the
 * bracket small or clipped instead of filling the panel.
 */
function FitBracket({
  size,
  children,
}: {
  size: { width: number; height: number };
  children: ReactNode;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentSize, setContentSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // Measure the bracket SVG's intrinsic size (set via width/height attrs).
  // Runs after every render; guarded so it converges once the size is stable
  // and re-measures if the bracket data changes.
  useIsomorphicLayoutEffect(() => {
    const svg = contentRef.current?.querySelector("svg");
    if (!svg) return;
    const width = Number.parseFloat(svg.getAttribute("width") ?? "") || 0;
    const height = Number.parseFloat(svg.getAttribute("height") ?? "") || 0;
    if (width > 0 && height > 0) {
      setContentSize((prev) =>
        prev && prev.width === width && prev.height === height
          ? prev
          : { width, height },
      );
    }
  });

  if (!contentSize) {
    return <div ref={contentRef}>{children}</div>;
  }

  const scale = Math.min(
    size.width / contentSize.width,
    size.height / contentSize.height,
  );

  return (
    <div
      ref={contentRef}
      className="absolute top-0 left-0"
      style={{
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}
    >
      {children}
    </div>
  );
}

type TournamentBracketGraphProps = {
  bracketId: string;
  readOnly?: boolean;
};

export function TournamentBracketGraph({
  bracketId,
  readOnly = false,
}: TournamentBracketGraphProps) {
  const {
    data: bracket,
    refetch,
    isLoading,
  } = api.tournaments.brackets.get.useQuery({ id: bracketId });

  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const { ref: containerRef, size } = useContainerSize<HTMLDivElement>();
  const isMobile = useMediaQuery("(max-width: 767px)");

  const { mutate: updateMatch, isPending: updatePending } =
    api.tournaments.matches.update.useMutation({
      onSuccess: () => {
        void refetch();
        setEditingMatchId(null);
        toast.success("Match updated successfully");
      },
      onError: (error) => {
        toast.error(<ErrorToast message={error.message} />);
      },
    });

  const onSelect = readOnly ? () => undefined : setEditingMatchId;

  const { isDoubleElim, singleMatches, doubleMatches } = useMemo(() => {
    if (!bracket) {
      return {
        isDoubleElim: false,
        singleMatches: [] as BracketMatch[],
        doubleMatches: {
          upper: [] as BracketMatch[],
          lower: [] as BracketMatch[],
        },
      };
    }

    const isDoubleElim = bracket.bracketType === "DOUBLE_ELIMINATION";

    const bracketNodes = bracket.bracketNodes;
    const wbNodes = bracketNodes.filter((n) => n.isWinnerBracket);
    const lbNodes = bracketNodes.filter((n) => !n.isWinnerBracket);
    // Plan WB rounds derived from bracket size. Can't use max node round:
    // in double elimination the grand final node lives at round wbRounds + 1
    // and would skew the count.
    const wbRounds = log2(bracket.bracketSize);
    const lbRounds = Math.max(0, ...lbNodes.map((n) => n.round));

    const nodeByKey = new Map(
      bracketNodes.map((n) => [
        `${n.isWinnerBracket ? "wb" : "lb"}:${n.round}:${n.position}`,
        n,
      ]),
    );

    function buildMatch(node: (typeof bracketNodes)[number]): BracketMatch {
      const participants: BracketParticipant[] =
        node.match?.TournamentMatchParticipant.map((p) => ({
          id: p.id,
          name: p.participant?.nickname ?? p.team?.name ?? undefined,
          isWinner: p.isWinner,
          resultText: null,
          wonScore: p.wonScore,
          lostScore: p.lostScore,
        })) ?? [];

      // Single elimination: the champion match IS the last WB round.
      // Double elimination: a dedicated grand final node at wbRounds + 1.
      const isGrandFinal =
        node.isWinnerBracket &&
        node.round === (isDoubleElim ? wbRounds + 1 : wbRounds);

      // Loser-drop links (double elimination only, WB nodes only). Computed
      // on the fly since this link isn't persisted (see
      // tournamentBracketRepository.syncBracketAdvancement).
      let nextLooserMatchId: string | undefined;
      if (node.isWinnerBracket && node.round <= wbRounds && lbRounds > 0) {
        const dropTarget = getLoserDropTarget(node.round, node.position);
        const targetNode = nodeByKey.get(
          `lb:${dropTarget.round}:${dropTarget.position}`,
        );
        nextLooserMatchId = targetNode?.id;
      }

      return {
        id: node.id,
        nextMatchId: node.parentNodeId ?? null,
        nextLooserMatchId,
        tournamentRoundText: isGrandFinal ? "GF" : String(node.round),
        startTime: "",
        state: "SCORE_DONE",
        participants,
        matchId: node.matchId,
        isWinnerBracket: node.isWinnerBracket,
        round: node.round,
        isGrandFinal,
        onSelect,
      };
    }

    if (isDoubleElim) {
      return {
        isDoubleElim,
        singleMatches: [] as BracketMatch[],
        doubleMatches: {
          upper: wbNodes.map(buildMatch),
          lower: lbNodes.map(buildMatch),
        },
      };
    }

    return {
      isDoubleElim,
      singleMatches: wbNodes.map(buildMatch),
      doubleMatches: {
        upper: [] as BracketMatch[],
        lower: [] as BracketMatch[],
      },
    };
  }, [bracket, onSelect]);

  const editingMatch = useMemo<ExtendedTournamentMatch | undefined>(() => {
    if (!editingMatchId || !bracket) return undefined;
    const node = bracket.bracketNodes.find((n) => n.matchId === editingMatchId);
    if (!node?.match) return undefined;

    return {
      ...node.match,
      group: null,
      GameCount: node.match.Game?.length ?? 0,
      TournamentMatchMode: null,
    } as ExtendedTournamentMatch;
  }, [editingMatchId, bracket]);

  const handleSubmit = (data: TournamentMatchFormSchema) => {
    if (!editingMatchId) return;

    updateMatch({
      id: editingMatchId,
      data: {
        matchDate: data.matchDate,
        civDraftKey: data.civDraftKey,
        mapDraftKey: data.mapDraftKey,
        status: data.status,
        comment: data.comment,
        adminComment: data.adminComment,
        participantScores: data.participantScores,
        teamScores: data.teamScores,
      },
    });
  };

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading bracket...</p>;
  }

  if (!bracket) {
    return <p className="text-muted-foreground text-sm">Bracket not found.</p>;
  }

  const options = {
    style: {
      width: BOX_WIDTH,
      boxHeight: BOX_HEIGHT,
      spaceBetweenColumns: 30,
      spaceBetweenRows: 30,
      roundHeader: { isShown: false },
    },
  };

  const svgViewerWrapper: NonNullable<CommonTreeProps["svgWrapper"]> = ({
    children,
    ...props
  }) => (
    <SVGViewer
      width={size.width}
      height={size.height}
      background="transparent"
      SVGBackground="transparent"
      {...props}
    >
      {children}
    </SVGViewer>
  );

  const bracketElement = isDoubleElim ? (
    <DoubleEliminationBracket
      matches={
        doubleMatches as unknown as {
          upper: MatchType[];
          lower: MatchType[];
        }
      }
      matchComponent={MatchCard}
      options={options}
      svgWrapper={isMobile ? svgViewerWrapper : undefined}
    />
  ) : (
    <SingleEliminationBracket
      matches={singleMatches as unknown as MatchType[]}
      matchComponent={MatchCard}
      options={options}
      svgWrapper={isMobile ? svgViewerWrapper : undefined}
    />
  );

  return (
    <div
      ref={containerRef}
      className="bg-muted/20 relative h-[70vh] w-full overflow-hidden rounded-lg border"
    >
      {isMobile ? (
        bracketElement
      ) : (
        <FitBracket size={size}>{bracketElement}</FitBracket>
      )}

      {!readOnly && (
        <Drawer
          open={!!editingMatchId}
          onOpenChange={(open) => {
            if (!open) setEditingMatchId(null);
          }}
        >
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Edit Bracket Match</DrawerTitle>
              <DrawerDescription>
                Update the match result. Winner advancement to the next round is
                automatic.
              </DrawerDescription>
            </DrawerHeader>

            <TournamentMatchForm
              initialData={editingMatch}
              onSubmit={handleSubmit}
              onCancel={() => setEditingMatchId(null)}
              isPending={updatePending}
            />
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}
