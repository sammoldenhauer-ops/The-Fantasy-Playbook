import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublishedArticles } from "@/lib/data/articles";

export const dynamic = "force-dynamic";

function formatDate(date: Date | null) {
  return date
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date)
    : "Recently";
}

export default async function ArticlesPage() {
  const articles = await getPublishedArticles();

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-12">
      <div className="mb-10">
        <Badge variant="outline">The fantasy desk</Badge>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Articles</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
          Rankings context, lineup ideas, and the occasional take worth arguing about.
        </p>
      </div>

      {articles === null ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">Articles are temporarily unavailable.</CardContent></Card>
      ) : articles.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">New articles are on the way.</CardContent></Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Card key={article.slug} className="overflow-hidden transition-shadow hover:shadow-lg">
              <div
                className="aspect-[16/9] bg-gradient-to-br from-emerald-400/70 via-cyan-400/40 to-violet-500/70"
                style={article.coverImageUrl ? { backgroundImage: `url("${article.coverImageUrl}")`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}
              />
              <CardHeader>
                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>{formatDate(article.publishedAt)}</span>
                  {article.authorName && <span>{article.authorName}</span>}
                </div>
                <CardTitle className="line-clamp-2 pt-2 text-xl">{article.title}</CardTitle>
                <CardDescription className="line-clamp-3 text-sm leading-6">
                  {article.excerpt ?? "Read the latest from The Fantasy Playbook."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link className="text-sm font-semibold underline-offset-4 hover:underline" href={`/articles/${article.slug}`}>
                  Read article →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
