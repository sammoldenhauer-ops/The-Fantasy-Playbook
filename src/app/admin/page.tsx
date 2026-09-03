import { auth } from "@/auth";
import { isAdminSession } from "@/lib/admin";
import Link from "next/link";

export default async function AdminPage() {
  const session = await auth();

  if (!session || !isAdminSession(session)) {
    return null;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 px-6 py-16">
      <p className="text-sm font-medium text-muted-foreground">The Fantasy Playbook</p>
      <h1 className="text-4xl font-bold tracking-tight">Admin</h1>
      <p className="text-muted-foreground">
        You are signed in as {session.user?.email}. Admin tools will live here as they are built.
      </p>
      <Link className="text-sm font-medium underline underline-offset-4" href="/admin/import">
        Import projections
      </Link>
      <Link className="text-sm font-medium underline underline-offset-4" href="/admin/articles/new">
        Write an article
      </Link>
    </main>
  );
}
