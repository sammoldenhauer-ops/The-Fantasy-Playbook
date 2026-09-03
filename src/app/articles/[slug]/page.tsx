import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getArticleBySlug } from "@/lib/data/articles";

import { CommentForm } from "./comment-form";
import { ShareControls } from "./share-controls";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

function formatDate(date: Date | null) {
  return date
    ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(date)
    : "Recently";
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const article = await getArticleBySlug((await params).slug);
  if (!article) return { title: "Article not found" };
  return {
    title: article.title,
    description: article.excerpt ?? "Fantasy football analysis from The Fantasy Playbook.",
    openGraph: {
      title: article.title,
      description: article.excerpt ?? "Fantasy football analysis from The Fantasy Playbook.",
      type: "article",
      publishedTime: article.publishedAt?.toISOString(),
      images: article.coverImageUrl ? [{ url: article.coverImageUrl }] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: { params: Params }) {
  const article = await getArticleBySlug((await params).slug);
  if (!article) notFound();
  const session = await auth();

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-12">
      <Link className="text-sm font-medium text-muted-foreground hover:underline" href="/articles">← All articles</Link>
      <article className="mt-8">
        <div
          className="aspect-[2.4/1] rounded-2xl bg-gradient-to-br from-emerald-400/70 via-cyan-400/40 to-violet-500/70"
          style={article.coverImageUrl ? { backgroundImage: `url("${article.coverImageUrl}")`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}
        />
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Badge variant="outline">{formatDate(article.publishedAt)}</Badge>
          {article.authorName && <span className="text-sm text-muted-foreground">by {article.authorName}</span>}
        </div>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">{article.title}</h1>
        <div className="mt-6 flex items-center justify-between gap-4 border-b pb-6">
          <span className="text-sm text-muted-foreground">{article.comments.length} comment{article.comments.length === 1 ? "" : "s"}</span>
          <ShareControls title={article.title} />
        </div>
        <div className="prose prose-slate dark:prose-invert mt-8 max-w-none leading-7">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.bodyMarkdown}</ReactMarkdown>
        </div>
      </article>

      <Card className="mt-14">
        <CardHeader><CardTitle>Comments</CardTitle></CardHeader>
        <CardContent className="space-y-8">
          {session ? (
            <CommentForm articleId={article.id} />
          ) : (
            <p className="text-sm text-muted-foreground">
              <Link className="font-medium underline underline-offset-4" href={`/api/auth/signin?callbackUrl=/articles/${article.slug}`}>Sign in</Link> to join the conversation.
            </p>
          )}
          {article.comments.length > 0 && (
            <div className="space-y-5">
              {article.comments.map((comment) => (
                <div key={comment.id} className="border-t pt-5">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium">{comment.user.name ?? comment.user.email ?? "The Fantasy Playbook reader"}</span>
                    <time className="text-muted-foreground">{formatDate(comment.createdAt)}</time>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{comment.body}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
