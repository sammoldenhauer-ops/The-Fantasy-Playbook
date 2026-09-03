import type { Prisma, ScoringFormat } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type StatValue = { mean: number; stdDev: number };

export type TeamStat = { key: string; label: string; value: StatValue };

function toStats(value: Prisma.JsonValue): TeamStat[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value)
    .map(([key, raw]) => {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
      const record = raw as Record<string, unknown>;
      const mean = typeof record.mean === "number" ? record.mean : null;
      const stdDev = typeof record.stdDev === "number" ? record.stdDev : 0;
      return mean === null
        ? null
        : { key, label: key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase()), value: { mean, stdDev } };
    })
    .filter((stat): stat is TeamStat => stat !== null);
}

function recordValue(value: Prisma.JsonValue | null, key: string): number | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = (value as Record<string, unknown>)[key];
  return typeof raw === "number" ? raw : null;
}

export async function getTeamRankings(scoringFormat: ScoringFormat) {
  try {
    const latestSeason = await prisma.teamProjection.aggregate({
      where: { scoringFormat },
      _max: { season: true },
    });
    const season = latestSeason._max.season;
    if (!season) {
      return { available: true as const, season: null, teams: [], matchups: [] };
    }

    const [seasonRows, weeklyRows] = await Promise.all([
      prisma.teamProjection.findMany({
        where: { scoringFormat, season, week: 0 },
        orderBy: { team: "asc" },
        select: { team: true, statsJson: true, standingsJson: true },
      }),
      prisma.teamProjection.findMany({
        where: { scoringFormat, season, week: { gt: 0 } },
        orderBy: [{ week: "desc" }, { team: "asc" }],
        select: { team: true, week: true, opponent: true, projectedPoints: true, projectedPointsStdDev: true },
      }),
    ]);

    const currentWeek = weeklyRows[0]?.week ?? null;
    const matchups = weeklyRows.filter((row) => row.week === currentWeek);

    return {
      available: true as const,
      season,
      teams: seasonRows.map((row) => ({
        team: row.team,
        stats: toStats(row.statsJson),
        wins: recordValue(row.standingsJson, "wins"),
        playoffOdds: recordValue(row.standingsJson, "playoffOdds"),
      })),
      matchups,
    };
  } catch (error) {
    console.error("Unable to load team rankings:", error);
    return { available: false as const, season: null, teams: [], matchups: [] };
  }
}
