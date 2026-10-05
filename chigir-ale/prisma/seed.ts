/**
 * Chigir Ale - Database Seed Script
 * Spec: Sections 11 (Categories), 32 (Routing), 52 (Org), 53 (Departments), 54 (Teams)
 * Seeds the initial category hierarchy, municipality organization, operational
 * departments, maintenance teams, and default routing rules.
 */
import { PrismaClient, OrganizationType } from "@prisma/client";

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

const DEPARTMENTS = [
  {
    name: "Roads & Civil Infrastructure",
    slug: "roads-infrastructure",
    description: "Maintenance of roads, bridges, pavements, and public structures.",
    teams: [
      { name: "Pothole & Pavement Repair Crew", slug: "pavement-crew" },
      { name: "Bridge & Civil Structures Team", slug: "bridges-team" },
    ],
  },
  {
    name: "Water & Sewerage Authority",
    slug: "water-sewerage",
    description: "Management of public water pipelines, drainage, and sewerage systems.",
    teams: [
      { name: "Water Main Leak Rapid Response", slug: "water-leak-crew" },
      { name: "Drainage & Flood Clearance Team", slug: "drainage-team" },
    ],
  },
  {
    name: "Electricity & Power Utility",
    slug: "electricity-power",
    description: "Management of power distribution grids, transformers, and public streetlights.",
    teams: [
      { name: "Streetlights Maintenance Team", slug: "streetlights-team" },
      { name: "Grid & Outage Response Unit", slug: "grid-response-team" },
    ],
  },
  {
    name: "Environmental Sanitation & Waste",
    slug: "sanitation-waste",
    description: "Municipal waste collection, public dumps, and neighborhood sanitation.",
    teams: [
      { name: "Solid Waste Collection Squad", slug: "waste-squad" },
      { name: "Public Sanitation Team", slug: "sanitation-team" },
    ],
  },
];

async function main() {
  console.log("🌱 Seeding Chigir Ale database …");

  // 1. Seed Categories
  const categoryMap = new Map<string, string>();
  for (const parent of CATEGORIES) {
    const { children, ...parentData } = parent;
    const parentCat = await prisma.category.upsert({
      where: { slug: parentData.slug },
      update: parentData,
      create: { ...parentData, description: `${parentData.name} category` },
    });
    categoryMap.set(parentCat.slug, parentCat.id);
    console.log(`  ✓ Category: ${parentCat.name}`);

    if (children) {
      for (const child of children) {
        const childCat = await prisma.category.upsert({
          where: { slug: child.slug },
          update: child,
          create: { ...child, parentId: parentCat.id, description: `${child.name} sub‑category` },
        });
        categoryMap.set(childCat.slug, childCat.id);
        console.log(`    ↳ Subcategory: ${childCat.name}`);
      }
    }
  }

  // 2. Seed Municipality Organization
  const municipality = await prisma.organization.upsert({
    where: { slug: "addis-ababa-city-admin" },
    update: { name: "Addis Ababa City Administration" },
    create: {
      name: "Addis Ababa City Administration",
      slug: "addis-ababa-city-admin",
      type: OrganizationType.MUNICIPALITY,
      description: "Primary municipal government authority for Addis Ababa.",
    },
  });
  console.log(`  ✓ Organization: ${municipality.name}`);

  // 3. Seed Departments & Teams
  const departmentMap = new Map<string, string>();
  for (const dept of DEPARTMENTS) {
    const department = await prisma.department.upsert({
      where: {
        organizationId_slug: {
          organizationId: municipality.id,
          slug: dept.slug,
        },
      },
      update: { name: dept.name, description: dept.description },
      create: {
        name: dept.name,
        slug: dept.slug,
        description: dept.description,
        organizationId: municipality.id,
      },
    });
    departmentMap.set(department.slug, department.id);
    console.log(`  ✓ Department: ${department.name}`);

    for (const team of dept.teams) {
      const existingTeam = await prisma.team.findFirst({
        where: { departmentId: department.id, slug: team.slug },
      });
      if (!existingTeam) {
        await prisma.team.create({
          data: {
            name: team.name,
            slug: team.slug,
            departmentId: department.id,
          },
        });
        console.log(`    ↳ Team: ${team.name}`);
      }
    }
  }

  // 4. Seed Standard Routing Rules (Spec Section 32)
  const ROUTING_MAPPINGS = [
    { categorySlug: "roads", deptSlug: "roads-infrastructure", priority: 10 },
    { categorySlug: "bridges", deptSlug: "roads-infrastructure", priority: 10 },
    { categorySlug: "traffic-infrastructure", deptSlug: "roads-infrastructure", priority: 10 },
    { categorySlug: "water", deptSlug: "water-sewerage", priority: 10 },
    { categorySlug: "drainage", deptSlug: "water-sewerage", priority: 10 },
    { categorySlug: "electricity", deptSlug: "electricity-power", priority: 10 },
    { categorySlug: "streetlights", deptSlug: "electricity-power", priority: 10 },
    { categorySlug: "waste-management", deptSlug: "sanitation-waste", priority: 10 },
    { categorySlug: "sanitation", deptSlug: "sanitation-waste", priority: 10 },
  ];

  for (const rule of ROUTING_MAPPINGS) {
    const catId = categoryMap.get(rule.categorySlug);
    const deptId = departmentMap.get(rule.deptSlug);
    if (catId && deptId) {
      const existingRule = await prisma.routingRule.findFirst({
        where: {
          categoryId: catId,
          organizationId: municipality.id,
          departmentId: deptId,
        },
      });
      if (!existingRule) {
        await prisma.routingRule.create({
          data: {
            categoryId: catId,
            organizationId: municipality.id,
            departmentId: deptId,
            priority: rule.priority,
            active: true,
          },
        });
        console.log(`    ↳ Routing Rule: ${rule.categorySlug} -> ${rule.deptSlug}`);
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
