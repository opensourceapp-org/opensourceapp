import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient, UserRole } from "../src/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const categories = [
    { slug: "developer-tools", name: "Developer tools", sortOrder: 1 },
    { slug: "productivity", name: "Productivity", sortOrder: 2 },
    { slug: "infrastructure", name: "Infrastructure", sortOrder: 3 },
  ];
  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      create: c,
      update: c,
    });
  }

  const platforms = [
    { slug: "web", name: "Web" },
    { slug: "linux", name: "Linux" },
    { slug: "macos", name: "macOS" },
    { slug: "windows", name: "Windows" },
    { slug: "docker", name: "Docker" },
  ];
  for (const p of platforms) {
    await prisma.platform.upsert({
      where: { slug: p.slug },
      create: p,
      update: p,
    });
  }

  const licenses = [
    { slug: "mit", name: "MIT License", spdxId: "MIT" },
    { slug: "apache-2", name: "Apache 2.0", spdxId: "Apache-2.0" },
    { slug: "gpl-3", name: "GPL 3.0", spdxId: "GPL-3.0" },
  ];
  for (const l of licenses) {
    await prisma.license.upsert({
      where: { slug: l.slug },
      create: l,
      update: l,
    });
  }

  const tags = [
    { slug: "self-hosted", name: "Self-hosted" },
    { slug: "cli", name: "CLI" },
  ];
  for (const t of tags) {
    await prisma.tag.upsert({
      where: { slug: t.slug },
      create: t,
      update: t,
    });
  }

  const demoSlug = "demo-app";
  const existing = await prisma.application.findUnique({
    where: { slug: demoSlug },
  });
  if (!existing) {
    const cat = await prisma.category.findUnique({
      where: { slug: "developer-tools" },
    });
    const platform = await prisma.platform.findUnique({ where: { slug: "web" } });
    const license = await prisma.license.findUnique({ where: { slug: "mit" } });

    const app = await prisma.application.create({
      data: {
        slug: demoSlug,
        name: "Demo App",
        tagline: "Example listing for local development",
        description:
          "This seeded application demonstrates the public directory layout, SEO metadata, and verification signal placeholders.",
        repositoryUrl: "https://github.com/opensourceapp-org/opensourceapp",
        repositoryHost: "github",
        primaryLanguage: "TypeScript",
        stars: 0,
        publishedAt: new Date(),
      },
    });

    if (cat) {
      await prisma.applicationCategory.create({
        data: { applicationId: app.id, categoryId: cat.id },
      });
    }
    if (platform) {
      await prisma.applicationPlatform.create({
        data: { applicationId: app.id, platformId: platform.id },
      });
    }
    if (license) {
      await prisma.applicationLicense.create({
        data: { applicationId: app.id, licenseId: license.id },
      });
    }

    await prisma.verificationSignal.createMany({
      data: [
        {
          applicationId: app.id,
          type: "SOURCE_REPOSITORY",
          status: "ACTIVE",
          summary: "Public repository (seed data)",
        },
        {
          applicationId: app.id,
          type: "LICENSE",
          status: "ACTIVE",
          summary: "MIT license (seed data)",
        },
        {
          applicationId: app.id,
          type: "REPO_ACTIVITY",
          status: "ACTIVE",
          summary: "Recent activity (seed data)",
        },
      ],
    });
  }

  const showcaseApps = [
    {
      slug: "markora",
      name: "Markora",
      tagline: "Open-source knowledge management",
      description:
        "Markora helps teams capture notes, docs, and decisions in a self-hosted knowledge base. Seed listing for local UI development.",
      repositoryUrl: "https://github.com/example/markora",
      stars: 1240,
      forks: 86,
      openIssuesCount: 12,
      primaryLanguage: "TypeScript",
      categorySlug: "productivity",
      platformSlugs: ["web", "linux", "macos"],
      licenseSlug: "mit",
      latestReleaseTag: "v1.8.2",
      latestReleaseAt: new Date(Date.now() - 2 * 86400000),
      latestReleaseUrl: "https://github.com/example/markora/releases/tag/v1.8.2",
      signals: ["SOURCE_REPOSITORY", "LICENSE", "REPO_ACTIVITY", "RELEASE"] as const,
    },
    {
      slug: "dsa-x",
      name: "dsa-x",
      tagline: "Data structures toolkit for educators",
      description:
        "Interactive visualizations for teaching algorithms. Seed data only.",
      repositoryUrl: "https://github.com/example/dsa-x",
      stars: 420,
      forks: 34,
      primaryLanguage: "Rust",
      categorySlug: "developer-tools",
      platformSlugs: ["linux", "windows"],
      licenseSlug: "apache-2",
      lastCommitAt: new Date(Date.now() - 3 * 86400000),
      signals: ["SOURCE_REPOSITORY", "REPO_ACTIVITY"] as const,
    },
    {
      slug: "my-cloud",
      name: "my-cloud",
      tagline: "Self-hosted file sync",
      description:
        "Sync files across devices with your own infrastructure. Seed listing.",
      repositoryUrl: "https://github.com/example/my-cloud",
      stars: 890,
      forks: 112,
      primaryLanguage: "Go",
      categorySlug: "infrastructure",
      platformSlugs: ["linux", "docker"],
      licenseSlug: "gpl-3",
      latestReleaseTag: "v0.8.0",
      latestReleaseAt: new Date(Date.now() - 5 * 86400000),
      signals: ["SOURCE_REPOSITORY", "LICENSE", "RELEASE"] as const,
    },
  ];

  for (const item of showcaseApps) {
    const exists = await prisma.application.findUnique({
      where: { slug: item.slug },
    });
    if (exists) continue;

    const app = await prisma.application.create({
      data: {
        slug: item.slug,
        name: item.name,
        tagline: item.tagline,
        description: item.description,
        repositoryUrl: item.repositoryUrl,
        repositoryHost: "github",
        stars: item.stars,
        forks: item.forks,
        openIssuesCount: item.openIssuesCount ?? null,
        primaryLanguage: item.primaryLanguage,
        lastCommitAt: item.lastCommitAt ?? new Date(Date.now() - 7 * 86400000),
        latestReleaseTag: item.latestReleaseTag ?? null,
        latestReleaseAt: item.latestReleaseAt ?? null,
        latestReleaseUrl: item.latestReleaseUrl ?? null,
        publishedAt: new Date(Date.now() - Math.random() * 14 * 86400000),
      },
    });

    const cat = await prisma.category.findUnique({
      where: { slug: item.categorySlug },
    });
    const license = await prisma.license.findUnique({
      where: { slug: item.licenseSlug },
    });
    if (cat) {
      await prisma.applicationCategory.create({
        data: { applicationId: app.id, categoryId: cat.id },
      });
    }
    if (license) {
      await prisma.applicationLicense.create({
        data: { applicationId: app.id, licenseId: license.id },
      });
    }
    for (const pSlug of item.platformSlugs) {
      const platform = await prisma.platform.findUnique({ where: { slug: pSlug } });
      if (platform) {
        await prisma.applicationPlatform.create({
          data: { applicationId: app.id, platformId: platform.id },
        });
      }
    }
    for (const signalType of item.signals) {
      await prisma.verificationSignal.create({
        data: {
          applicationId: app.id,
          type: signalType,
          status: "ACTIVE",
          summary: `${signalType} (seed data)`,
        },
      });
    }
  }

  // Optional bootstrap admin — set SEED_ADMIN_EMAIL to promote on seed
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  if (adminEmail) {
    await prisma.user.updateMany({
      where: { email: adminEmail },
      data: { role: UserRole.ADMIN },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
