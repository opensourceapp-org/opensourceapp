import type { MetadataRoute } from "next";
import { publishedApplicationWhere } from "@/lib/applications/visibility";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.AUTH_URL ?? "http://localhost:3000";
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/apps`, changeFrequency: "daily", priority: 0.9 },
  ];

  try {
    const apps = await prisma.application.findMany({
      where: publishedApplicationWhere(),
      select: { slug: true, updatedAt: true },
    });
    return [
      ...staticRoutes,
      ...apps.map((app) => ({
        url: `${base}/apps/${app.slug}`,
        lastModified: app.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
