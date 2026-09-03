import type { Position, ScoringFormat } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const positions: Position[] = ["QB", "RB", "WR", "TE"];

export async function getLineupData(scoringFormat: ScoringFormat, selectedIds: string[]) {
  try {
    const projections = await prisma.playerProjection.findMany({
      where: { scoringFormat, leagueFormat: "redraft" },
      orderBy: { seasonPoints: "desc" },
      select: {
        playerId: true,
        seasonPoints: true,
        player: { select: { id: true, name: true, team: true, position: true } },
      },
    });

    const selected = projections.filter((row) => selectedIds.includes(row.playerId));
    const byPosition = positions.map((position) => {
      const players = selected.filter((row) => row.player.position === position);
      return {
        position,
        players,
        total: players.reduce((sum, player) => sum + player.seasonPoints, 0),
      };
    });
    const weakest = [...byPosition].sort((a, b) => a.total - b.total).slice(0, 2);
    const targets = projections
      .filter((row) => weakest.some((group) => group.position === row.player.position) && !selectedIds.includes(row.playerId))
      .slice(0, 8);

    return { available: true as const, projections, selected, byPosition, weakest, targets };
  } catch (error) {
    console.error("Unable to load lineup data:", error);
    return { available: false as const, projections: [], selected: [], byPosition: [], weakest: [], targets: [] };
  }
}
