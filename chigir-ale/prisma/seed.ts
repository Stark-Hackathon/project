/**
 * Chigir Ale - Database Seed Script
 * Spec: Section 11 — Infrastructure Categories
 * Seeds the initial category hierarchy for the platform.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIES = [
  // Infrastructure
  {
    name: "Infrastructure",
    slug: "infrastructure",
    icon: "🏗️",
    colorToken: "gray",
    sortOrder: 1,
    children: [
      { name: "Roads", slug: "roads", icon: "🛣️", colorToken: "amber", sortOrder: 1 },
      { name: "Bridges", slug: "bridges", icon: "🌉", colorToken: "amber", sortOrder: 2 },
      { name: "Drainage", slug: "drainage", icon: "🌊", colorToken: "blue", sortOrder: 3 },
      { name: "Streetlights", slug: "streetlights", icon: "💡", colorToken: "yellow", sortOrder: 4 },
      { name: "Traffic Infrastructure", slug: "traffic-infrastructure", icon: "🚦", colorToken: "red", sortOrder: 5 },
      { name: "Public Facilities", slug: "public-facilities", icon: "🏛️", colorToken: "purple", sortOrder: 6 },
    ],
  },
  // Utilities
  {
    name: "Utilities",
    slug: "utilities",
    icon: "⚡",
    colorToken: "blue",
    sortOrder: 2,
    children: [
      { name: "Water", slug: "water", icon: "💧", colorToken: "blue", sortOrder: 1 },
      { name: "Electricity", slug: "electricity", icon: "⚡", colorToken: "yellow", sortOrder: 2 },
      { name: "Telecommunications", slug: "telecommunications", icon: "📡", colorToken: "purple", sortOrder: 3 },
      { name: "Network", slug: "network", icon: "🌐", colorToken: "indigo", sortOrder: 4 },
    ],
  },
  // Public Services
  {
    name: "Public Services",
    slug: "public-services",
    icon: "🏪",
    colorToken: "green",
    sortOrder: 3,
    children: [
      { name: "Waste Management", slug: "waste-management", icon: "🗑️", colorToken: "green", sortOrder: 1 },
      { name: "Sanitation", slug: "sanitation", icon: "🚿", colorToken: "teal", sortOrder: 2 },
      { name: "Other Community Issues", slug: "other-community", icon: "🏘️", colorToken: "gray", sortOrder: 3 },
    ],
  },
];

async function main() {
  console.log("🌱 Seeding categories …");
  for (const parent of CATEGORIES) {
    const { children, ...parentData } = parent;
    const parentCat = await prisma.category.upsert({
      where: { slug: parentData.slug },
      update: parentData,
      create: { ...parentData, description: `${parentData.name} category` },
    });
    console.log(`  ✓ ${parentCat.name}`);
    if (children) {
      for (const child of children) {
        const childCat = await prisma.category.upsert({
          where: { slug: child.slug },
          update: child,
          create: { ...child, parentId: parentCat.id, description: `${child.name} sub‑category` },
        });
        console.log(`    ↳ ${childCat.name}`);
      }
    }
  }
  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
