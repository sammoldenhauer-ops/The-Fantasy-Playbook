import { ImportForm } from "./import-form";

export default function ImportPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-12">
      <div className="mb-8 space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Admin tools</p>
        <h1 className="text-4xl font-bold tracking-tight">Import projections</h1>
        <p className="max-w-2xl text-muted-foreground">
          Upload player, player projection, or team projection CSVs. Preview the file, map its columns,
          and upsert the rows into the database.
        </p>
      </div>
      <ImportForm />
    </main>
  );
}
