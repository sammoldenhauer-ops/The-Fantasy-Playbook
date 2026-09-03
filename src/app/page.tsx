import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getHomeData } from "@/lib/data/home";

export const dynamic = "force-dynamic";

const navLinks = [
  { label: "Player rankings", href: "/rankings/players" },
  { label: "Team projections", href: "/rankings/teams" },
  { label: "Articles", href: "/articles" },
  { label: "Lineup analysis", href: "/lineup" },
  { label: "Trade analyzer", href: "/tools/trade-analyzer" },
  { label: "Start / sit", href: "/tools/start-sit" },
];

function formatPublishedDate(date: Date | null | undefined) {
  if (!date) return "Recently";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function playoffOdds(standingsJson: unknown) {
  if (!standingsJson || typeof standingsJson !== "object" || Array.isArray(standingsJson)) {
    return null;
  }
  const value = (standingsJson as Record<string, unknown>).playoffOdds;
  return typeof value === "number" ? `${Math.round(value * 100)}%` : null;
}

export default async function Home() {
  const { available, latestArticle, playerProjections, teamProjection } = await getHomeData();

  return (
    <main className="min-h-screen overflow-hidden">
      <section className="relative border-b bg-[radial-gradient(circle_at_top_right,oklch(0.78_0.16_160/.2),transparent_45%),linear-gradient(135deg,oklch(0.18_0.05_280),oklch(0.12_0.03_250))] text-white">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <Badge className="mb-6 border-white/20 bg-white/10 text-white hover:bg-white/10">Fantasy football, but make it fun.</Badge>
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
              Trust your gut.
              <br />
              Check the vibes.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/70 sm:text-xl">
              Player rankings, team projections, and the numbers behind your next fantasy football
              decision — without the spreadsheet headache.
            </p>
          </div>
          <nav aria-label="Primary" className="mt-10 flex flex-wrap gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex h-9 items-center justify-center rounded-full border border-white/25 bg-white/10 px-2.5 text-sm font-medium text-white transition-colors hover:bg-white hover:text-slate-950"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-16 px-6 py-16">
        {!available && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-700 dark:text-amber-300">
            Rankings data is getting warmed up. Connect your Postgres database and import projections to
            populate the dashboard.
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-500" />
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <Badge variant="secondary">Latest article</Badge>
                {latestArticle?.publishedAt && (
                  <span className="text-sm text-muted-foreground">
                    {formatPublishedDate(latestArticle.publishedAt)}
                  </span>
                )}
              </div>
              <CardTitle className="pt-4 text-3xl">
                {latestArticle?.title ?? "The vibes are loading"}
              </CardTitle>
              <CardDescription className="max-w-xl text-base leading-7">
                {latestArticle?.excerpt ??
                  "Fresh fantasy takes, useful context, and just enough chaos to keep Sunday interesting."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {latestArticle ? (
                <Link
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
                  href={`/articles/${latestArticle.slug}`}
                >
                  Read the latest
                </Link>
              ) : (
                <Link
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
                  href="/articles"
                >
                  Browse articles
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Projection pulse</CardTitle>
              <CardDescription>A quick read on the current model.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-2xl font-bold">{playerProjections.length || "—"}</p>
                <p className="mt-1 text-sm text-muted-foreground">top players loaded</p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-2xl font-bold">{teamProjection?.team ?? "—"}</p>
                <p className="mt-1 text-sm text-muted-foreground">team spotlight</p>
              </div>
              <div className="col-span-2 rounded-lg bg-muted p-4">
                <p className="text-2xl font-bold">{playoffOdds(teamProjection?.standingsJson)}</p>
                <p className="mt-1 text-sm text-muted-foreground">projected playoff odds</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <Badge variant="outline">PPR / redraft</Badge>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">Rankings preview</h2>
              <p className="mt-2 text-muted-foreground">A tiny taste of the board. Save the debates for later.</p>
            </div>
            <Link className="hidden text-sm font-medium underline-offset-4 hover:underline sm:inline-flex" href="/rankings/players">
              See full rankings →
            </Link>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-5 py-4 font-medium">Rank</th>
                      <th className="px-5 py-4 font-medium">Player</th>
                      <th className="px-5 py-4 font-medium">Pos</th>
                      <th className="px-5 py-4 font-medium">Team</th>
                      <th className="px-5 py-4 text-right font-medium">Projected points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playerProjections.length > 0 ? (
                      playerProjections.map((projection, index) => (
                        <tr key={`${projection.player.name}-${projection.player.team}`} className="border-b last:border-0">
                          <td className="px-5 py-4 font-semibold text-muted-foreground">{index + 1}</td>
                          <td className="px-5 py-4 font-medium">{projection.player.name}</td>
                          <td className="px-5 py-4"><Badge variant="secondary">{projection.player.position}</Badge></td>
                          <td className="px-5 py-4 text-muted-foreground">{projection.player.team}</td>
                          <td className="px-5 py-4 text-right font-semibold">{projection.seasonPoints.toFixed(1)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                          No projections imported yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          <Link className="mt-3 inline-flex text-sm font-medium underline-offset-4 hover:underline sm:hidden" href="/rankings/players">
            See full rankings →
          </Link>
        </section>
      </div>
    </main>
  );
}
