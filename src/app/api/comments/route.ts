import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in to post a comment." }, { status: 401 });
  }

  const payload: unknown = await request.json();
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Invalid comment payload." }, { status: 400 });
  }
  const { articleId, body } = payload as { articleId?: unknown; body?: unknown };
  if (typeof articleId !== "string" || typeof body !== "string" || body.trim().length < 1 || body.length > 2000) {
    return NextResponse.json({ error: "Comments must be between 1 and 2000 characters." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "Your account is not ready for comments yet." }, { status: 400 });
  }
  const article = await prisma.article.findFirst({ where: { id: articleId, publishedAt: { not: null } } });
  if (!article) {
    return NextResponse.json({ error: "Article not found." }, { status: 404 });
  }

  await prisma.comment.create({ data: { articleId, userId: user.id, body: body.trim() } });
  return NextResponse.json({ ok: true }, { status: 201 });
}
