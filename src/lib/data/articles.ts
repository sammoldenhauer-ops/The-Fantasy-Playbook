import { prisma } from "@/lib/prisma";

export async function getPublishedArticles() {
  try {
    return await prisma.article.findMany({
      where: { publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
      select: {
        title: true,
        slug: true,
        excerpt: true,
        coverImageUrl: true,
        publishedAt: true,
        authorName: true,
      },
    });
  } catch (error) {
    console.error("Unable to load articles:", error);
    return null;
  }
}

export async function getArticleBySlug(slug: string) {
  try {
    return await prisma.article.findFirst({
      where: { slug, publishedAt: { not: null } },
      select: {
        id: true,
        title: true,
        slug: true,
        bodyMarkdown: true,
        excerpt: true,
        coverImageUrl: true,
        publishedAt: true,
        authorName: true,
        comments: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            body: true,
            createdAt: true,
            user: { select: { name: true, email: true, image: true } },
          },
        },
      },
    });
  } catch (error) {
    console.error("Unable to load article:", error);
    return null;
  }
}
