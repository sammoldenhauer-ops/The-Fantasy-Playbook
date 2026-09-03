import Link from "next/link";

import { Badge } from "@/components/ui/badge";

export function ComingSoon({
  title,
  description,
  backHref = "/",
}: {
  title: string;
  description: string;
  backHref?: string;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
      <Badge variant="secondary">Coming soon</Badge>
      <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
      <p className="mt-4 max-w-xl text-lg leading-8 text-muted-foreground">{description}</p>
      <Link className="mt-8 text-sm font-semibold underline-offset-4 hover:underline" href={backHref}>
        ← Back to The Fantasy Playbook
      </Link>
    </main>
  );
}
