import Link from "next/link";
import type { ScoringFormat } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLineupData } from "@/lib/data/lineup";

import { LineupForm } from "./lineup-form";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LineupPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const requestedScoring = first(params.scoringFormat);
  const scoringFormat: ScoringFormat = ["ppr", "half_ppr", "standard"].includes(requestedScoring ?? "")
    ? (requestedScoring as ScoringFormat)
    : "ppr";
  const leagueSizeValue = Number(first(params.leagueSize));
  const leagueSize = [8, 10, 12, 14, 16].includes(leagueSizeValue) ? leagueSizeValue : 12;
  const selectedIds = Array.isArray(params.player) ? params.player : params.player ? [params.player] : [];
  const data = await getLineupData(scoringFormat, selectedIds);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-12">
      <Link className="text-sm font-medium text-muted-foreground hover:underline" href="/">← Home</Link>
      <div className="mb-10 mt-4">
        <Badge variant="outline">Manual roster tool</Badge>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Lineup analysis</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
          Pick your roster, see where the juice is, and find the spots worth upgrading.
        </p>
      </div>

      {!data.available && (
        <div className="mb-8 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-700 dark:text-amber-300">
          Projections are temporarily unavailable. Connect Postgres and import player projections to analyze a roster.
        </div>
      )}

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Build your roster</CardTitle>
          <CardDescription>Select players from the imported projection pool. Platform linking is a future enhancement.</CardDescription>
        </CardHeader>
        <CardContent>
          <LineupForm
            players={data.projections.map((row) => row.player)}
            scoringFormat={scoringFormat}
            selectedIds={selectedIds}
            leagueSize={leagueSize}
          />
        </CardContent>
      </Card>

      {selectedIds.length > 0 && data.selected.length > 0 && (
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Roster strength</CardTitle>
              <CardDescription>Projected season points by position for this {leagueSize}-team league.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.byPosition.map((group) => (
                <div key={group.position}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium">{group.position}</span>
                    <span className="font-semibold">{group.total.toFixed(1)} projected points</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-violet-500" style={{ width: `${Math.min(100, Math.max(4, (group.total / 1200) * 100))}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{group.players.map((player) => player.player.name).join(", ") || "No players selected"}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Where to upgrade</CardTitle>
              <CardDescription>Your lowest projected position groups.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap gap-2">
                {data.weakest.map((group) => <Badge key={group.position} variant="secondary">{group.position}</Badge>)}
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium">Players to target</p>
                {data.targets.length > 0 ? data.targets.map((target) => (
                  <div key={target.playerId} className="flex items-center justify-between border-b pb-3 text-sm last:border-0">
                    <span><span className="font-medium">{target.player.name}</span> <span className="text-muted-foreground">{target.player.team} · {target.player.position}</span></span>
                    <span className="font-semibold">{target.seasonPoints.toFixed(1)}</span>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No target recommendations yet.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
