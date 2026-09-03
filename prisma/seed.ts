/**
 * Prisma seed script stub.
 *
 * Real ranking/projection data is imported via the /admin/import CSV tool
 * (see the csv-import phase), not generated here. This seed script exists so
 * local development has a couple of sample rows to develop the rankings and
 * articles pages against.
 *
 * Run with: npx prisma db seed
 */
import { PrismaClient, Position, ScoringFormat, LeagueFormat } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const mahomes = await prisma.player.upsert({
    where: { externalId: "sample-mahomes" },
    update: {},
    create: {
      name: "Patrick Mahomes",
      team: "KC",
      position: Position.QB,
      externalId: "sample-mahomes",
    },
  });

  await prisma.playerProjection.upsert({
    where: {
      playerId_scoringFormat_leagueFormat_season: {
        playerId: mahomes.id,
        scoringFormat: ScoringFormat.ppr,
        leagueFormat: LeagueFormat.redraft,
        season: 2026,
      },
    },
    update: {},
    create: {
      playerId: mahomes.id,
      scoringFormat: ScoringFormat.ppr,
      leagueFormat: LeagueFormat.redraft,
      season: 2026,
      seasonPoints: 385.4,
      riskScore: 0.22,
      boomRate: 0.31,
      bustRate: 0.12,
      expectationRate: 0.57,
      source: "seed-script",
    },
  });

  await prisma.teamProjection.upsert({
    where: {
      team_scoringFormat_season_week: {
        team: "KC",
        scoringFormat: ScoringFormat.ppr,
        season: 2026,
        week: 1,
      },
    },
    update: {},
    create: {
      team: "KC",
      scoringFormat: ScoringFormat.ppr,
      season: 2026,
      week: 1,
      statsJson: {
        passYds: { mean: 245, stdDev: 35 },
        rushYds: { mean: 110, stdDev: 22 },
      },
      standingsJson: { wins: 11.2, losses: 5.8, playoffOdds: 0.78 },
      opponent: "BAL",
      projectedPoints: 24.5,
      projectedPointsStdDev: 6.1,
      source: "seed-script",
    },
  });

  const article = await prisma.article.upsert({
    where: { slug: "welcome-to-the-fantasy-playbook" },
    update: {},
    create: {
      title: "Welcome to The Fantasy Playbook",
      slug: "welcome-to-the-fantasy-playbook",
      bodyMarkdown: "# Welcome\n\nThis is a sample article seeded for local development.",
      excerpt: "A quick intro to what we're building here.",
      authorName: "The Fantasy Playbook Team",
      publishedAt: new Date(),
    },
  });

  console.log({ mahomes: mahomes.id, article: article.id });
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
