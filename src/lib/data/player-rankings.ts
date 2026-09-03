import type { Position, ScoringFormat } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const pageSize = 25;
const sortFields = {
  seasonPoints: "seasonPoints",
  riskScore: "riskScore",
  boomRate: "boomRate",
  bustRate: "bustRate",
  expectationRate: "expectationRate",
} as const;

export type PlayerRankingSort = keyof typeof sortFields;

export async function getPlayerRankings({
  page,
  position,
  scoringFormat,
  sort,
}: {
  page: number;
  position?: Position;
  scoringFormat: ScoringFormat;
  sort: PlayerRankingSort;
}) {
  const safePage = Math.max(1, page);
  const where = {
    scoringFormat,
    leagueFormat: "redraft" as const,
    ...(position ? { player: { position } } : {}),
  };

  try {
    const [total, rows] = await Promise.all([
      prisma.playerProjection.count({ where }),
      prisma.playerProjection.findMany({
        where,
        orderBy: { [sortFields[sort]]: "desc" },
        skip: (safePage - 1) * pageSize,
        take: pageSize,
        select: {
          seasonPoints: true,
          riskScore: true,
          boomRate: true,
          bustRate: true,
          expectationRate: true,
          player: { select: { name: true, team: true, position: true } },
        },
      }),
    ]);

    return {
      available: true as const,
      rows,
      total,
      page: safePage,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  } catch (error) {
    console.error("Unable to load player rankings:", error);
    return { available: false as const, rows: [], total: 0, page: safePage, pageCount: 1 };
  }
}
