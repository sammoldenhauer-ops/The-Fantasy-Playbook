import { prisma } from "@/lib/prisma";

export async function getHomeData() {
  try {
    const [latestArticle, playerProjections, teamProjection] = await Promise.all([
      prisma.article.findFirst({
        where: { publishedAt: { not: null } },
        orderBy: { publishedAt: "desc" },
        select: {
          title: true,
          slug: true,
          excerpt: true,
          coverImageUrl: true,
          publishedAt: true,
        },
      }),
      prisma.playerProjection.findMany({
        where: { scoringFormat: "ppr", leagueFormat: "redraft" },
        orderBy: { seasonPoints: "desc" },
        take: 5,
        select: {
          seasonPoints: true,
          riskScore: true,
          player: { select: { name: true, team: true, position: true } },
        },
      }),
      prisma.teamProjection.findFirst({
        where: { scoringFormat: "ppr", week: 0 },
        orderBy: { season: "desc" },
        select: { team: true, standingsJson: true },
      }),
    ]);

    return { available: true as const, latestArticle, playerProjections, teamProjection };
  } catch (error) {
    console.error("Unable to load home page data:", error);
    return { available: false as const, latestArticle: null, playerProjections: [], teamProjection: null };
  }
}
