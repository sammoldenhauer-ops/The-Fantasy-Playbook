"use client";

import { useMemo, useState } from "react";
import Papa from "papaparse";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  importFields,
  type ImportEntity,
  type ImportMapping,
} from "@/lib/import/csv-importer";

type Preview = {
  headers: string[];
  rows: Record<string, string>[];
};

const entityLabels: Record<ImportEntity, string> = {
  players: "Players",
  playerProjections: "Player projections",
  teamProjections: "Team projections",
};

export function ImportForm() {
  const [entity, setEntity] = useState<ImportEntity>("playerProjections");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [mapping, setMapping] = useState<ImportMapping>({});
  const [status, setStatus] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const fields = importFields[entity];
  const sampleRows = useMemo(() => preview?.rows.slice(0, 3) ?? [], [preview]);

  function resetForEntity(nextEntity: ImportEntity) {
    setEntity(nextEntity);
    setMapping({});
    setStatus(null);
  }

  function handleFileChange(nextFile: File | undefined) {
    if (!nextFile) {
      return;
    }
    setFile(nextFile);
    setStatus(null);
    Papa.parse<Record<string, string>>(nextFile, {
      header: true,
      preview: 4,
      skipEmptyLines: "greedy",
      transformHeader: (header) => header.trim(),
      complete: (result) => {
        if (result.errors.length > 0 || !result.meta.fields?.length) {
          setPreview(null);
          setStatus("Could not read that CSV. Check that it has a header row.");
          return;
        }
        setPreview({ headers: result.meta.fields, rows: result.data });
        const automaticMapping: ImportMapping = {};
        for (const field of importFields[entity]) {
          const match = result.meta.fields.find(
            (header) => header.toLowerCase().replace(/[^a-z0-9]/g, "") === field.key.toLowerCase(),
          );
          if (match) {
            automaticMapping[field.key] = match;
          }
        }
        setMapping(automaticMapping);
      },
      error: () => {
        setPreview(null);
        setStatus("Could not read that CSV.");
      },
    });
  }

  async function submitImport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || !preview) {
      setStatus("Choose a CSV file first.");
      return;
    }

    setIsImporting(true);
    setStatus(null);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("entity", entity);
    formData.set("mapping", JSON.stringify(mapping));

    try {
      const response = await fetch("/api/admin/import", { method: "POST", body: formData });
      const result = (await response.json()) as { imported?: number; error?: string };
      if (!response.ok) {
        setStatus(result.error ?? "The import failed.");
      } else {
        setStatus(`Imported ${result.imported ?? 0} row${result.imported === 1 ? "" : "s"} successfully.`);
      }
    } catch {
      setStatus("The import request failed. Check your connection and try again.");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={submitImport}>
      <Card>
        <CardHeader>
          <CardTitle>1. Choose an import type</CardTitle>
          <CardDescription>
            Rows are upserted, so re-uploading an updated projection file is safe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {(Object.keys(entityLabels) as ImportEntity[]).map((option) => (
              <Button
                key={option}
                type="button"
                variant={entity === option ? "default" : "outline"}
                onClick={() => resetForEntity(option)}
              >
                {entityLabels[option]}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Upload a CSV</CardTitle>
          <CardDescription>Maximum file size: 10 MB. The first row must contain column headers.</CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="csv-file">CSV file</Label>
          <input
            id="csv-file"
            className="mt-2 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => handleFileChange(event.target.files?.[0])}
          />
        </CardContent>
      </Card>

      {preview && (
        <Card>
          <CardHeader>
            <CardTitle>3. Map columns</CardTitle>
            <CardDescription>
              Required fields are marked with an asterisk. Unmapped team columns become mean-only stats.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={`mapping-${field.key}`}>
                    {field.label}
                    {field.required ? " *" : ""}
                  </Label>
                  <select
                    id={`mapping-${field.key}`}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={mapping[field.key] ?? ""}
                    onChange={(event) =>
                      setMapping((current) => ({ ...current, [field.key]: event.target.value }))
                    }
                  >
                    <option value="">Do not map</option>
                    {preview.headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted">
                  <tr>
                    {preview.headers.map((header) => (
                      <th key={header} className="whitespace-nowrap px-3 py-2 font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sampleRows.map((row, index) => (
                    <tr key={index} className="border-t">
                      {preview.headers.map((header) => (
                        <td key={header} className="max-w-56 truncate px-3 py-2">
                          {row[header]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button type="submit" disabled={isImporting}>
              {isImporting ? "Importing..." : `Import ${entityLabels[entity]}`}
            </Button>
          </CardContent>
        </Card>
      )}

      {status && <p className="rounded-md border bg-muted px-4 py-3 text-sm">{status}</p>}
    </form>
  );
}
