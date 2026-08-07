"use client";

import {
  DoubleEliminationBracket,
  Match,
  SingleEliminationBracket,
  SVGViewer,
} from "@g-loot/react-tournament-brackets/dist/esm";
// Library's own demo data (deep import is fine - package has no `exports` map).
// Swap for real data once the dependency is confirmed working.
import { simpleSmallBracket } from "@g-loot/react-tournament-brackets/dist/esm/mock-data/simple-data";
import simpleDataDouble from "@g-loot/react-tournament-brackets/dist/esm/mock-data/simple-data-double";


export default function BracketTestPage() {



  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <h1 className="text-lg font-semibold">Bracket Test</h1>

      <section className="space-y-2">
        <h2 className="text-muted-foreground text-sm font-semibold uppercase">
          Single Elimination
        </h2>
        <SingleEliminationBracket
          matches={simpleSmallBracket}
          matchComponent={Match}
          svgWrapper={({ children, ...props }) => (
            <SVGViewer
              width={800}
              height={500}
              {...props}
            >
              {children}
            </SVGViewer>
          )}
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-muted-foreground text-sm font-semibold uppercase">
          Double Elimination
        </h2>
        <DoubleEliminationBracket
          matches={simpleDataDouble}
          matchComponent={Match}
          svgWrapper={({ children, ...props }) => (
            <SVGViewer
              width={800}
              height={500}
              {...props}
            >
              {children}
            </SVGViewer>
          )}
        />
      </section>
    </div>
  );
}
