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

    await prisma.verificationSignal.create({
      data: {
        applicationId: app.id,
        type: "REPO_ACTIVITY",
        status: "ACTIVE",
        summary: "Repository has recent commit activity (seed data)",
      },
    });
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
