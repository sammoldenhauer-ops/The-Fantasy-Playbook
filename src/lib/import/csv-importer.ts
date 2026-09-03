import Papa from "papaparse";

import type { Prisma, PrismaClient, Position, ScoringFormat, LeagueFormat } from "@prisma/client";

export type ImportEntity = "players" | "playerProjections" | "teamProjections";

export type ImportMapping = Record<string, string>;

export type ParsedCsv = {
  headers: string[];
  rows: Record<string, string>[];
};

const playerPositions = new Set(["QB", "RB", "WR", "TE", "K", "DST"]);
const scoringFormats = new Set(["ppr", "half_ppr", "standard"]);
const leagueFormats = new Set(["redraft", "dynasty"]);

export const importFields: Record<ImportEntity, { key: string; label: string; required?: boolean }[]> = {
  players: [
    { key: "name", label: "Player name", required: true },
    { key: "team", label: "Team", required: true },
    { key: "position", label: "Position", required: true },
    { key: "externalId", label: "External ID" },
    { key: "sleeperId", label: "Sleeper ID" },
    { key: "espnId", label: "ESPN ID" },
    { key: "yahooId", label: "Yahoo ID" },
  ],
  playerProjections: [
    { key: "name", label: "Player name", required: true },
    { key: "team", label: "Team" },
    { key: "position", label: "Position" },
    { key: "externalId", label: "External ID" },
    { key: "season", label: "Season", required: true },
    { key: "scoringFormat", label: "Scoring format" },
    { key: "leagueFormat", label: "League format" },
    { key: "seasonPoints", label: "Projected season points", required: true },
    { key: "riskScore", label: "Risk score" },
    { key: "boomRate", label: "Boom rate" },
    { key: "bustRate", label: "Bust rate" },
    { key: "expectationRate", label: "Expectation rate" },
    { key: "weeklyStatsJson", label: "Weekly stats JSON" },
  ],
  teamProjections: [
    { key: "team", label: "Team", required: true },
    { key: "season", label: "Season", required: true },
    { key: "week", label: "Week", required: true },
    { key: "scoringFormat", label: "Scoring format" },
    { key: "statsJson", label: "Stats JSON" },
    { key: "standingsJson", label: "Standings JSON" },
    { key: "opponent", label: "Opponent" },
    { key: "projectedPoints", label: "Projected points" },
    { key: "projectedPointsStdDev", label: "Projected points std dev" },
  ],
};

export function parseCsv(csv: string): ParsedCsv {
  const result = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim(),
  });

  if (result.errors.length > 0) {
    const firstError = result.errors[0];
    throw new Error(`CSV parse error on row ${firstError.row}: ${firstError.message}`);
  }

  const headers = result.meta.fields ?? [];
  if (headers.length === 0) {
    throw new Error("The CSV must include a header row.");
  }

  return { headers, rows: result.data };
}

function valueFor(row: Record<string, string>, mapping: ImportMapping, field: string): string {
  return (mapping[field] ? row[mapping[field]] : "")?.trim() ?? "";
}

function requiredValue(row: Record<string, string>, mapping: ImportMapping, field: string): string {
  const value = valueFor(row, mapping, field);
  if (!value) {
    throw new Error(`Missing required value for "${field}".`);
  }
  return value;
}

function numberValue(value: string, field: string, required = false): number | undefined {
  if (!value) {
    if (required) {
      throw new Error(`Missing required numeric value for "${field}".`);
    }
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`"${value}" is not a valid number for "${field}".`);
  }
  return parsed;
}

function jsonValue(value: string, field: string): Prisma.InputJsonValue | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed === null || typeof parsed !== "object") {
      throw new Error("must be a JSON object or array");
    }
    return parsed as Prisma.InputJsonValue;
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid JSON";
    throw new Error(`"${field}" contains invalid JSON: ${message}.`);
  }
}

function positionValue(value: string): Position {
  const position = value.toUpperCase();
  if (!playerPositions.has(position)) {
    throw new Error(`"${value}" is not a supported position.`);
  }
  return position as Position;
}

function scoringValue(value: string): ScoringFormat {
  const scoringFormat = (value || "ppr").toLowerCase();
  if (!scoringFormats.has(scoringFormat)) {
    throw new Error(`"${value}" is not a supported scoring format.`);
  }
  return scoringFormat as ScoringFormat;
}

function leagueValue(value: string): LeagueFormat {
  const leagueFormat = (value || "redraft").toLowerCase();
  if (!leagueFormats.has(leagueFormat)) {
    throw new Error(`"${value}" is not a supported league format.`);
  }
  return leagueFormat as LeagueFormat;
}

function nullableText(value: string): string | null {
  return value || null;
}

function playerWhere(row: Record<string, string>, mapping: ImportMapping): Prisma.PlayerWhereInput {
  const externalId = valueFor(row, mapping, "externalId");
  return externalId
    ? { externalId }
    : {
        name: requiredValue(row, mapping, "name"),
        team: requiredValue(row, mapping, "team"),
      };
}

async function findOrCreatePlayer(
  client: Prisma.TransactionClient,
  row: Record<string, string>,
  mapping: ImportMapping,
) {
  const name = requiredValue(row, mapping, "name");
  const team = valueFor(row, mapping, "team");
  const positionText = valueFor(row, mapping, "position");
  const externalId = nullableText(valueFor(row, mapping, "externalId"));

  const existing = await client.player.findFirst({ where: playerWhere(row, mapping) });
  if (existing) {
    return client.player.update({
      where: { id: existing.id },
      data: {
        name,
        ...(team ? { team } : {}),
        ...(positionText ? { position: positionValue(positionText) } : {}),
        ...(mapping.externalId ? { externalId } : {}),
        ...(mapping.sleeperId ? { sleeperId: nullableText(valueFor(row, mapping, "sleeperId")) } : {}),
        ...(mapping.espnId ? { espnId: nullableText(valueFor(row, mapping, "espnId")) } : {}),
        ...(mapping.yahooId ? { yahooId: nullableText(valueFor(row, mapping, "yahooId")) } : {}),
      },
    });
  }

  return client.player.create({
    data: {
      name,
      team: team || requiredValue(row, mapping, "team"),
      position: positionValue(positionText || requiredValue(row, mapping, "position")),
      externalId,
      sleeperId: mapping.sleeperId ? nullableText(valueFor(row, mapping, "sleeperId")) : null,
      espnId: mapping.espnId ? nullableText(valueFor(row, mapping, "espnId")) : null,
      yahooId: mapping.yahooId ? nullableText(valueFor(row, mapping, "yahooId")) : null,
    },
  });
}

function statsFromUnmappedColumns(
  row: Record<string, string>,
  headers: string[],
  mapping: ImportMapping,
): Prisma.InputJsonValue {
  const mappedHeaders = new Set(Object.values(mapping).filter(Boolean));
  const stats: Record<string, { mean: number; stdDev: number }> = {};

  for (const header of headers) {
    if (mappedHeaders.has(header) || !row[header]) {
      continue;
    }
    const numericValue = numberValue(row[header], header);
    if (numericValue !== undefined) {
      stats[header] = { mean: numericValue, stdDev: 0 };
    }
  }

  return stats;
}

export async function importCsvRows(
  client: PrismaClient,
  parsedCsv: ParsedCsv,
  entity: ImportEntity,
  mapping: ImportMapping,
  source: string,
): Promise<{ imported: number }> {
  const fields = importFields[entity];
  for (const field of fields.filter((field) => field.required)) {
    if (!mapping[field.key]) {
      throw new Error(`Map the required "${field.label}" column before importing.`);
    }
  }

  let imported = 0;
  await client.$transaction(async (tx) => {
    for (const row of parsedCsv.rows) {
      if (entity === "players") {
        await findOrCreatePlayer(tx, row, mapping);
      } else if (entity === "playerProjections") {
        const player = await findOrCreatePlayer(tx, row, mapping);
        await tx.playerProjection.upsert({
          where: {
            playerId_scoringFormat_leagueFormat_season: {
              playerId: player.id,
              scoringFormat: scoringValue(valueFor(row, mapping, "scoringFormat")),
              leagueFormat: leagueValue(valueFor(row, mapping, "leagueFormat")),
              season: numberValue(valueFor(row, mapping, "season"), "season", true)!,
            },
          },
          update: {
            seasonPoints: numberValue(valueFor(row, mapping, "seasonPoints"), "seasonPoints", true)!,
            riskScore: numberValue(valueFor(row, mapping, "riskScore"), "riskScore"),
            boomRate: numberValue(valueFor(row, mapping, "boomRate"), "boomRate"),
            bustRate: numberValue(valueFor(row, mapping, "bustRate"), "bustRate"),
            expectationRate: numberValue(
              valueFor(row, mapping, "expectationRate"),
              "expectationRate",
            ),
            weeklyStatsJson: jsonValue(valueFor(row, mapping, "weeklyStatsJson"), "weeklyStatsJson"),
            source,
            importedAt: new Date(),
          },
          create: {
            playerId: player.id,
            scoringFormat: scoringValue(valueFor(row, mapping, "scoringFormat")),
            leagueFormat: leagueValue(valueFor(row, mapping, "leagueFormat")),
            season: numberValue(valueFor(row, mapping, "season"), "season", true)!,
            seasonPoints: numberValue(valueFor(row, mapping, "seasonPoints"), "seasonPoints", true)!,
            riskScore: numberValue(valueFor(row, mapping, "riskScore"), "riskScore"),
            boomRate: numberValue(valueFor(row, mapping, "boomRate"), "boomRate"),
            bustRate: numberValue(valueFor(row, mapping, "bustRate"), "bustRate"),
            expectationRate: numberValue(
              valueFor(row, mapping, "expectationRate"),
              "expectationRate",
            ),
            weeklyStatsJson: jsonValue(valueFor(row, mapping, "weeklyStatsJson"), "weeklyStatsJson"),
            source,
          },
        });
      } else {
        const statsJson =
          jsonValue(valueFor(row, mapping, "statsJson"), "statsJson") ??
          statsFromUnmappedColumns(row, parsedCsv.headers, mapping);
        await tx.teamProjection.upsert({
          where: {
            team_scoringFormat_season_week: {
              team: requiredValue(row, mapping, "team").toUpperCase(),
              scoringFormat: scoringValue(valueFor(row, mapping, "scoringFormat")),
              season: numberValue(valueFor(row, mapping, "season"), "season", true)!,
              week: numberValue(valueFor(row, mapping, "week"), "week", true)!,
            },
          },
          update: {
            statsJson,
            standingsJson: jsonValue(valueFor(row, mapping, "standingsJson"), "standingsJson"),
            opponent: nullableText(valueFor(row, mapping, "opponent")),
            projectedPoints: numberValue(valueFor(row, mapping, "projectedPoints"), "projectedPoints"),
            projectedPointsStdDev: numberValue(
              valueFor(row, mapping, "projectedPointsStdDev"),
              "projectedPointsStdDev",
            ),
            source,
            importedAt: new Date(),
          },
          create: {
            team: requiredValue(row, mapping, "team").toUpperCase(),
            scoringFormat: scoringValue(valueFor(row, mapping, "scoringFormat")),
            season: numberValue(valueFor(row, mapping, "season"), "season", true)!,
            week: numberValue(valueFor(row, mapping, "week"), "week", true)!,
            statsJson,
            standingsJson: jsonValue(valueFor(row, mapping, "standingsJson"), "standingsJson"),
            opponent: nullableText(valueFor(row, mapping, "opponent")),
            projectedPoints: numberValue(valueFor(row, mapping, "projectedPoints"), "projectedPoints"),
            projectedPointsStdDev: numberValue(
              valueFor(row, mapping, "projectedPointsStdDev"),
              "projectedPointsStdDev",
            ),
            source,
          },
        });
      }
      imported += 1;
    }
  });

  return { imported };
}
