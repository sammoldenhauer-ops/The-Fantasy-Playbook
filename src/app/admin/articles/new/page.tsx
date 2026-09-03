import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { ArticleEditor } from "./article-editor";

export default function NewArticlePage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-12">
      <Link className="text-sm font-medium text-muted-foreground hover:underline" href="/admin">
        ← Admin
      </Link>
      <div className="mb-8 mt-4">
        <h1 className="text-4xl font-bold tracking-tight">New article</h1>
        <p className="mt-2 text-muted-foreground">
          Write in Markdown, preview it as readers will see it, then publish when it feels right.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Article editor</CardTitle>
          <CardDescription>
            Cover images currently use a hosted image URL. Plug in object storage when uploads are ready.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ArticleEditor />
        </CardContent>
      </Card>
    </main>
  );
}
