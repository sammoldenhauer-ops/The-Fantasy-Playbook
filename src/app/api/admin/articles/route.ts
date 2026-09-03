import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { isAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const articleSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens.").max(200),
  bodyMarkdown: z.string().trim().min(1).max(100000),
  excerpt: z.string().trim().max(300).optional().or(z.literal("")),
  coverImageUrl: z.string().trim().url().max(2000).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session || !isAdminSession(session)) {
    return NextResponse.json({ error: "Admin access is required." }, { status: 403 });
  }

  const payload: unknown = await request.json();
  const parsed = articleSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid article." }, { status: 400 });
  }

  const existing = await prisma.article.findUnique({ where: { slug: parsed.data.slug }, select: { id: true } });
  if (existing) {
    return NextResponse.json({ error: "That slug is already in use." }, { status: 409 });
  }

  const article = await prisma.article.create({
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      bodyMarkdown: parsed.data.bodyMarkdown,
      excerpt: parsed.data.excerpt || null,
      coverImageUrl: parsed.data.coverImageUrl || null,
      authorName: session.user?.name ?? session.user?.email ?? "The Fantasy Playbook",
      publishedAt: new Date(),
    },
    select: { slug: true },
  });

  return NextResponse.json({ slug: article.slug }, { status: 201 });
}
