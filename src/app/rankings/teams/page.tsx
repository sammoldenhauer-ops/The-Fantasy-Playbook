import Link from "next/link";
import type { ScoringFormat } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTeamRankings } from "@/lib/data/team-rankings";

export const dynamic = "force-dynamic";

const scoringOptions: { label: string; value: ScoringFormat }[] = [
  { label: "PPR", value: "ppr" },
  { label: "Half-PPR", value: "half_ppr" },
  { label: "Standard", value: "standard" },
];

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function percent(value: number | null) {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}

function rangeLabel(mean: number, stdDev: number) {
  return `${mean.toFixed(1)} ± ${stdDev.toFixed(1)}`;
}

export default async function TeamRankingsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const requestedScoring = firstParam(params.scoringFormat);
  const scoringFormat = scoringOptions.some((option) => option.value === requestedScoring)
    ? (requestedScoring as ScoringFormat)
    : "ppr";
  const rankings = await getTeamRankings(scoringFormat);
  const statColumns = rankings.teams.reduce(
    (columns, team) => {
      for (const stat of team.stats) {
        if (!columns.some((column) => column.key === stat.key)) columns.push(stat);
      }
      return columns;
    },
    [] as { key: string; label: string }[],
  );
  const hasData = rankings.available && rankings.teams.length > 0;
  const currentWeek = rankings.matchups[0]?.week;

  return (
    <main className="mx-auto min-h-screen max-w-[1500px] px-6 py-12">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link className="text-sm font-medium text-muted-foreground hover:underline" href="/rankings">
            ← Rankings
          </Link>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">Team projections</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Volume, efficiency, scoring, and the uncertainty around every number.
          </p>
        </div>
        <Badge variant="outline">Redraft · {scoringOptions.find((option) => option.value === scoringFormat)?.label}</Badge>
      </div>

      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between gap-4 border-b">
          <div>
            <CardTitle>{rankings.season ? `${rankings.season} season outlook` : "Season outlook"}</CardTitle>
            <CardDescription className="mt-1">Every stat is shown as mean ± standard deviation.</CardDescription>
          </div>
          <form method="get" className="flex items-center gap-2">
            <label className="sr-only" htmlFor="scoringFormat">Scoring format</label>
            <select id="scoringFormat" name="scoringFormat" defaultValue={scoringFormat} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
              {scoringOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <button className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground" type="submit">Update</button>
          </form>
        </CardHeader>
        <CardContent className="p-0">
          {!rankings.available ? (
            <div className="px-6 py-16 text-center text-muted-foreground">Team projections are temporarily unavailable.</div>
          ) : !hasData ? (
            <div className="px-6 py-16 text-center">
              <Badge variant="secondary">Data coming soon</Badge>
              <p className="mt-4 text-sm text-muted-foreground">Import season-long team projections to populate this table.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="border-b bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="sticky left-0 bg-muted/50 px-5 py-4 font-medium">Team</th>
                    <th className="px-5 py-4 text-right font-medium">Wins</th>
                    <th className="px-5 py-4 text-right font-medium">Playoff odds</th>
                    {statColumns.map((stat) => <th key={stat.key} className="px-5 py-4 text-right font-medium">{stat.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rankings.teams.map((team) => (
                    <tr key={team.team} className="border-b last:border-0">
                      <td className="sticky left-0 bg-background px-5 py-4 font-semibold">{team.team}</td>
                      <td className="px-5 py-4 text-right">{team.wins?.toFixed(1) ?? "—"}</td>
                      <td className="px-5 py-4 text-right">{percent(team.playoffOdds)}</td>
                      {statColumns.map((column) => {
                        const stat = team.stats.find((item) => item.key === column.key);
                        return <td key={column.key} className="px-5 py-4 text-right tabular-nums">{stat ? rangeLabel(stat.value.mean, stat.value.stdDev) : "—"}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{currentWeek ? `Week ${currentWeek} matchup ranges` : "Current-week matchups"}</CardTitle>
          <CardDescription>Projected points are ranges, not false precision.</CardDescription>
        </CardHeader>
        <CardContent>
          {rankings.matchups.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Import weekly team projections to see matchup ranges.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {rankings.matchups.map((matchup) => {
                const mean = matchup.projectedPoints;
                const stdDev = matchup.projectedPointsStdDev ?? 0;
                return (
                  <div key={`${matchup.team}-${matchup.opponent}`} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="font-semibold">{matchup.team} <span className="text-muted-foreground">vs {matchup.opponent ?? "TBD"}</span></div>
                      <span className="font-semibold">{mean === null ? "—" : rangeLabel(mean, stdDev)}</span>
                    </div>
                    {mean !== null && (
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-violet-500" style={{ width: `${Math.min(100, Math.max(8, (mean / 40) * 100))}%` }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
