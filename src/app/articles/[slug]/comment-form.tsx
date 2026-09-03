"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function CommentForm({ articleId }: { articleId: string }) {
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("");
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, body }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setStatus(result.error ?? "Could not post comment.");
      } else {
        setBody("");
        setStatus("Comment posted.");
        window.location.reload();
      }
    } catch {
      setStatus("Could not post comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={submit}>
      <Textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Add to the vibes..." maxLength={2000} required />
      <div className="flex items-center gap-3">
        <Button disabled={isSubmitting || !body.trim()} type="submit">{isSubmitting ? "Posting..." : "Post comment"}</Button>
        {status && <span className="text-sm text-muted-foreground">{status}</span>}
      </div>
    </form>
  );
}
