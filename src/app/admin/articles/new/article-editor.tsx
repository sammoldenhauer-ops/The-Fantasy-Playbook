"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ArticleEditor() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [bodyMarkdown, setBodyMarkdown] = useState("# Your headline\n\nStart writing your take here...");
  const [status, setStatus] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  const preview = useMemo(() => bodyMarkdown || "_Your article preview will appear here._", [bodyMarkdown]);

  function updateTitle(value: string) {
    setTitle(value);
    if (!slugEdited) setSlug(slugify(value));
  }

  async function publish(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPublishing(true);
    setStatus("");
    try {
      const response = await fetch("/api/admin/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug, excerpt, coverImageUrl, bodyMarkdown }),
      });
      const result = (await response.json()) as { error?: string; slug?: string };
      if (!response.ok) {
        setStatus(result.error ?? "Could not publish article.");
        return;
      }
      router.push(`/articles/${result.slug}`);
    } catch {
      setStatus("Could not publish article. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={publish}>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Title
          <Input value={title} onChange={(event) => updateTitle(event.target.value)} required maxLength={200} />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Slug
          <Input
            value={slug}
            onChange={(event) => {
              setSlugEdited(true);
              setSlug(slugify(event.target.value));
            }}
            required
            maxLength={200}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium md:col-span-2">
          Cover image URL
          <Input
            type="url"
            value={coverImageUrl}
            onChange={(event) => setCoverImageUrl(event.target.value)}
            placeholder="https://images.example.com/fantasy-sunday.jpg"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium md:col-span-2">
          Excerpt
          <Textarea value={excerpt} onChange={(event) => setExcerpt(event.target.value)} maxLength={300} rows={3} />
        </label>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Markdown body
          <Textarea
            className="min-h-[480px] font-mono text-sm"
            value={bodyMarkdown}
            onChange={(event) => setBodyMarkdown(event.target.value)}
            required
          />
        </label>
        <div className="rounded-lg border p-5">
          <p className="mb-3 text-sm font-medium">Live preview</p>
          <div className="prose prose-slate dark:prose-invert max-w-none leading-7">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{preview}</ReactMarkdown>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button disabled={isPublishing} type="submit">
          {isPublishing ? "Publishing..." : "Publish article"}
        </Button>
        {status && <p className="text-sm text-muted-foreground">{status}</p>}
      </div>
    </form>
  );
}
