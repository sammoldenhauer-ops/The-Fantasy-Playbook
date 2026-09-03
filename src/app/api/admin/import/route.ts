import { NextResponse } from "next/server";

import { auth } from "@/auth";
import {
  importCsvRows,
  type ImportEntity,
  type ImportMapping,
  parseCsv,
} from "@/lib/import/csv-importer";
import { isAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const validEntities = new Set<ImportEntity>(["players", "playerProjections", "teamProjections"]);

export async function POST(request: Request) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Admin access is required." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const entityValue = formData.get("entity");
  const mappingValue = formData.get("mapping");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Select a CSV file to import." }, { status: 400 });
  }
  if (file.size === 0 || file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "CSV files must be between 1 byte and 10 MB." }, { status: 400 });
  }
  if (typeof entityValue !== "string" || !validEntities.has(entityValue as ImportEntity)) {
    return NextResponse.json({ error: "Select a valid import type." }, { status: 400 });
  }
  if (typeof mappingValue !== "string") {
    return NextResponse.json({ error: "Column mapping is required." }, { status: 400 });
  }

  let mapping: ImportMapping;
  try {
    const parsedMapping: unknown = JSON.parse(mappingValue);
    if (!parsedMapping || typeof parsedMapping !== "object" || Array.isArray(parsedMapping)) {
      throw new Error("mapping must be an object");
    }
    mapping = parsedMapping as ImportMapping;
  } catch {
    return NextResponse.json({ error: "Column mapping is invalid." }, { status: 400 });
  }

  try {
    const parsedCsv = parseCsv(await file.text());
    const result = await importCsvRows(
      prisma,
      parsedCsv,
      entityValue as ImportEntity,
      mapping,
      file.name,
    );
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The import failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
