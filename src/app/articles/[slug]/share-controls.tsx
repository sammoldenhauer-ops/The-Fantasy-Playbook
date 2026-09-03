"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ShareControls({ title }: { title: string }) {
  const [message, setMessage] = useState("");

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    setMessage("Link copied");
  }

  return (
    <div className="flex items-center gap-3">
      <Button type="button" variant="outline" onClick={share}>Share</Button>
      {message && <span className="text-sm text-muted-foreground">{message}</span>}
    </div>
  );
}
