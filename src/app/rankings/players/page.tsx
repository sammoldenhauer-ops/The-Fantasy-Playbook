import Link from "next/link";
import type { Position, ScoringFormat } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPlayerRankings, type PlayerRankingSort } from "@/lib/data/player-rankings";

export const dynamic = "force-dynamic";

const positions: { label: string; value: Position | "" }[] = [
  { label: "All positions", value: "" },
  { label: "Quarterbacks", value: "QB" },
  { label: "Running backs", value: "RB" },
  { label: "Wide receivers", value: "WR" },
  { label: "Tight ends", value: "TE" },
];

const scoringOptions: { label: string; value: ScoringFormat }[] = [
  { label: "PPR", value: "ppr" },
  { label: "Half-PPR", value: "half_ppr" },
  { label: "Standard", value: "standard" },
];

const sortOptions: { label: string; value: PlayerRankingSort }[] = [
  { label: "Projected points", value: "seasonPoints" },
  { label: "Risk score", value: "riskScore" },
  { label: "Boom rate", value: "boomRate" },
  { label: "Bust rate", value: "bustRate" },
  { label: "Expectation rate", value: "expectationRate" },
];

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function percentage(value: number | null) {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}

function hrefFor(params: { position: string; scoringFormat: ScoringFormat; sort: PlayerRankingSort; page: number }) {
  const query = new URLSearchParams();
  if (params.position) query.set("position", params.position);
  query.set("scoringFormat", params.scoringFormat);
  query.set("sort", params.sort);
  query.set("page", String(params.page));
  return `/rankings/players?${query.toString()}`;
}

export default async function PlayerRankingsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const requestedPosition = firstParam(params.position);
  const position = positions.some((option) => option.value === requestedPosition)
    ? (requestedPosition as Position | "")
    : "";
  const requestedScoring = firstParam(params.scoringFormat);
  const scoringFormat = scoringOptions.some((option) => option.value === requestedScoring)
    ? (requestedScoring as ScoringFormat)
    : "ppr";
  const requestedSort = firstParam(params.sort);
  const sort = sortOptions.some((option) => option.value === requestedSort)
    ? (requestedSort as PlayerRankingSort)
    : "seasonPoints";
  const requestedPage = Number(firstParam(params.page));
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const rankings = await getPlayerRankings({ page, position: position || undefined, scoringFormat, sort });
  const hasImportedRows = rankings.total > 0;
  const hasDataForFormat = rankings.available && hasImportedRows;
  const positionValue = position;

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-12">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link className="text-sm font-medium text-muted-foreground hover:underline" href="/rankings">
            ← Rankings
          </Link>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">Player rankings</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            A clean board for making the call when your gut and the group chat disagree.
          </p>
        </div>
        <Badge variant="outline">Redraft · {scoringOptions.find((option) => option.value === scoringFormat)?.label}</Badge>
      </div>

      <Card>
        <CardHeader className="gap-5 border-b">
          <div>
            <CardTitle>Season projections</CardTitle>
            <CardDescription className="mt-1">
              Sort by any model signal. Percentages represent the model&apos;s outcome rates.
            </CardDescription>
          </div>
          <form className="grid gap-3 sm:grid-cols-3" method="get">
            <label className="grid gap-2 text-sm font-medium">
              Position
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm font-normal"
                name="position"
                defaultValue={positionValue}
              >
                {positions.map((option) => (
                  <option key={option.label} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Scoring format
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm font-normal"
                name="scoringFormat"
                defaultValue={scoringFormat}
              >
                {scoringOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Sort by
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm font-normal"
                name="sort"
                defaultValue={sort}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <button className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground sm:col-span-3 sm:w-fit" type="submit">
              Update rankings
            </button>
          </form>
        </CardHeader>
        <CardContent className="p-0">
          {!rankings.available ? (
            <div className="px-6 py-16 text-center">
              <h2 className="text-lg font-semibold">Rankings are temporarily unavailable</h2>
              <p className="mt-2 text-sm text-muted-foreground">Check your database connection and try again.</p>
            </div>
          ) : !hasDataForFormat ? (
            <div className="px-6 py-16 text-center">
              <Badge variant="secondary">Data coming soon</Badge>
              <h2 className="mt-4 text-lg font-semibold">
                No {scoringOptions.find((option) => option.value === scoringFormat)?.label} projections yet
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Import a projection file for this scoring format, or switch back to PPR to view available data.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="border-b bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-5 py-4 font-medium">Rank</th>
                    <th className="px-5 py-4 font-medium">Player</th>
                    <th className="px-5 py-4 font-medium">Team</th>
                    <th className="px-5 py-4 font-medium">Pos</th>
                    <th className="px-5 py-4 text-right font-medium">Projected</th>
                    <th className="px-5 py-4 text-right font-medium">Risk</th>
                    <th className="px-5 py-4 text-right font-medium">Consistency</th>
                    <th className="px-5 py-4 text-right font-medium">Boom / bust</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.rows.map((row, index) => (
                    <tr key={`${row.player.name}-${row.player.team}`} className="border-b last:border-0">
                      <td className="px-5 py-4 font-semibold text-muted-foreground">
                        {(rankings.page - 1) * 25 + index + 1}
                      </td>
                      <td className="px-5 py-4 font-medium">{row.player.name}</td>
                      <td className="px-5 py-4 text-muted-foreground">{row.player.team}</td>
                      <td className="px-5 py-4"><Badge variant="secondary">{row.player.position}</Badge></td>
                      <td className="px-5 py-4 text-right font-semibold">{row.seasonPoints.toFixed(1)}</td>
                      <td className="px-5 py-4 text-right">{row.riskScore?.toFixed(2) ?? "—"}</td>
                      <td className="px-5 py-4 text-right">{percentage(row.expectationRate)}</td>
                      <td className="px-5 py-4 text-right">{percentage(row.boomRate)} / {percentage(row.bustRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {hasDataForFormat && (
        <nav aria-label="Player ranking pages" className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {rankings.page} of {rankings.pageCount} · {rankings.total} players
          </p>
          <div className="flex gap-2">
            {rankings.page > 1 && (
              <Link
                className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
                href={hrefFor({ position: positionValue, scoringFormat, sort, page: rankings.page - 1 })}
              >
                Previous
              </Link>
            )}
            {rankings.page < rankings.pageCount && (
              <Link
                className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
                href={hrefFor({ position: positionValue, scoringFormat, sort, page: rankings.page + 1 })}
              >
                Next
              </Link>
            )}
          </div>
        </nav>
      )}
    </main>
  );
}
