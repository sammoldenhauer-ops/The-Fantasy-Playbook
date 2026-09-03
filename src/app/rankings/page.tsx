import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const links = [
  {
    href: "/rankings/players",
    title: "Player rankings",
    description: "Projected points, risk, consistency, and boom/bust rates for every player.",
  },
  {
    href: "/rankings/teams",
    title: "Team projections",
    description: "Team-level volume, efficiency, scoring, standings, and weekly ranges.",
  },
];

export default function RankingsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-16">
      <Badge variant="outline">The model room</Badge>
      <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Rankings</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        Start with the players, zoom out to the teams, and make decisions with a little more context.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {links.map((link) => (
          <Card key={link.href} className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle>{link.title}</CardTitle>
              <CardDescription className="leading-6">{link.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link className="text-sm font-semibold underline-offset-4 hover:underline" href={link.href}>
                Explore {link.title.toLowerCase()} →
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
