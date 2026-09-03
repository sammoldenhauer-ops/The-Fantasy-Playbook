import Link from "next/link";
import Image from "next/image";

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
      <section className="relative min-h-[680px] overflow-hidden border-b border-emerald-950 bg-[linear-gradient(180deg,#67916b_0%,#286b58_43%,#063b2b_100%)] text-white sm:min-h-[min(760px,100svh)]">
        <div className="mx-auto grid min-h-[680px] w-full max-w-7xl items-center gap-6 px-6 py-14 sm:min-h-[min(760px,100svh)] sm:grid-cols-[1fr_1.05fr] sm:gap-10 sm:px-12 lg:px-20">
          <div className="relative mx-auto w-full max-w-[460px] sm:mx-0">
            <Image
              src="/playbook-mark.png"
              alt="The Fantasy Playbook"
              width={910}
              height={610}
              priority
              className="h-auto w-full object-contain"
            />
          </div>
          <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
            <p className="max-w-xl font-serif text-xl font-medium leading-relaxed text-white sm:text-2xl lg:text-[2rem] lg:leading-[1.35]">
              The prep work of a stats nerd, the simplicity
              <br className="hidden lg:block" /> of a friend who just tells you who to start.
              <br className="hidden lg:block" /> The Fantasy Playbook does the deep digging every
              <br className="hidden lg:block" /> week so you don&apos;t have to.
              <br className="hidden lg:block" /> Just sit back, relax, and trust the playbook.
            </p>
          </div>
        </div>
        <nav aria-label="Primary" className="absolute inset-x-0 bottom-8 mx-auto flex max-w-6xl flex-wrap justify-center gap-3 px-6 sm:bottom-10 sm:gap-5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-w-28 items-center justify-center rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-950"
            >
              {link.label === "Player rankings"
                ? "Rankings"
                : link.label === "Team projections"
                  ? "Projections"
                  : link.label === "Lineup analysis"
                    ? "My Lineup"
                    : link.label}
            </Link>
          ))}
        </nav>
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
