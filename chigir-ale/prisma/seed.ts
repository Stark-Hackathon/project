/**
 * Chigir Ale - Database Seed Script
 * Spec: Sections 11 (Categories), 32 (Routing), 52 (Org), 53 (Departments), 54 (Teams), 107 (Seed Data)
 * Seeds initial category hierarchy, municipality organization, operational departments,
 * maintenance teams, default routing rules, demo users, example reports, incidents, and notifications.
 *
 * NOTE: Contains only synthetic demo data for development and testing. Never real citizen data.
 */
import {
  PrismaClient,
  OrganizationType,
  MembershipRole,
  ReportStatus,
  Severity,
  IncidentRelationshipType,
} from "@prisma/client";
import bcrypt from "bcryptjs";

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

  // 5. Seed Demo Users & Memberships (Spec Section 107)
  const defaultPasswordHash = await bcrypt.hash("DemoPassword123!", 10);
  const DEMO_USERS: Array<{
    name: string;
    email: string;
    role: MembershipRole;
  }> = [
    { name: "Abebe Bikila", email: "citizen@chigirale.et", role: "CITIZEN" },
    { name: "Tigist Assefa", email: "staff@chigirale.et", role: "STAFF" },
    { name: "Dawit Haile", email: "manager@chigirale.et", role: "DEPARTMENT_MANAGER" },
    { name: "Mulugeta Kebede", email: "admin@chigirale.et", role: "ORG_ADMIN" },
    { name: "Sara Tadesse", email: "platform@chigirale.et", role: "PLATFORM_ADMIN" },
  ];

  const userMap = new Map<string, string>();
  for (const u of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, passwordHash: defaultPasswordHash },
      create: {
        name: u.name,
        email: u.email,
        passwordHash: defaultPasswordHash,
        preferredLanguage: "am",
      },
    });
    userMap.set(u.email, user.id);

    await prisma.membership.upsert({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: municipality.id,
        },
      },
      update: { role: u.role },
      create: {
        userId: user.id,
        organizationId: municipality.id,
        role: u.role,
      },
    });
    console.log(`  ✓ Demo User: ${u.name} (${u.role})`);
  }

  const citizenId = userMap.get("citizen@chigirale.et");
  const roadsCatId = categoryMap.get("roads");
  const streetlightsCatId = categoryMap.get("streetlights");
  const drainageCatId = categoryMap.get("drainage");

  // 6. Seed Example Reports & Incidents (Spec Section 107)
  if (citizenId && roadsCatId && streetlightsCatId && drainageCatId) {
    const existingRep1 = await prisma.report.findUnique({
      where: { publicReference: "CHI-2026-000001" },
    });
    let report1 = existingRep1;
    if (!existingRep1) {
      report1 = await prisma.report.create({
        data: {
          publicReference: "CHI-2026-000001",
          reporterId: citizenId,
          organizationId: municipality.id,
          categoryId: roadsCatId,
          title: "Major pothole damaging vehicles near Bole Medhanialem",
          description: "Severe road surface collapse on Cameroon Street near the cathedral.",
          severity: Severity.HIGH,
          status: ReportStatus.VERIFIED,
          latitude: 8.9984,
          longitude: 38.7865,
          formattedAddress: "Near Bole Medhanialem, Bole Sub-City, Addis Ababa",
          administrativeArea: "Bole Sub-City",
          priorityScore: 78.5,
        },
      });
      console.log(`  ✓ Example Report: ${report1.publicReference} (VERIFIED)`);
    }

    const existingRep2 = await prisma.report.findUnique({
      where: { publicReference: "CHI-2026-000002" },
    });
    if (!existingRep2) {
      await prisma.report.create({
        data: {
          publicReference: "CHI-2026-000002",
          reporterId: citizenId,
          organizationId: municipality.id,
          categoryId: streetlightsCatId,
          title: "Streetlight fixture non-functional on Cameroon Street",
          description: "Three consecutive street lights have been dark for 4 nights.",
          severity: Severity.MEDIUM,
          status: ReportStatus.IN_PROGRESS,
          latitude: 8.9992,
          longitude: 38.7871,
          formattedAddress: "Cameroon Street, Bole Sub-City, Addis Ababa",
          administrativeArea: "Bole Sub-City",
          priorityScore: 45.0,
        },
      });
      console.log(`  ✓ Example Report: CHI-2026-000002 (IN_PROGRESS)`);
    }

    const existingRep3 = await prisma.report.findUnique({
      where: { publicReference: "CHI-2026-000003" },
    });
    let report3 = existingRep3;
    if (!existingRep3) {
      report3 = await prisma.report.create({
        data: {
          publicReference: "CHI-2026-000003",
          reporterId: citizenId,
          organizationId: municipality.id,
          categoryId: drainageCatId,
          title: "Severe stormwater drain blockage causing road flooding",
          description: "Debris blocking primary culvert causing overflow across both lanes.",
          severity: Severity.CRITICAL,
          status: ReportStatus.RESOLVED,
          latitude: 8.9975,
          longitude: 38.7852,
          formattedAddress: "Bole Medhanialem Junction, Bole Sub-City, Addis Ababa",
          administrativeArea: "Bole Sub-City",
          priorityScore: 92.0,
        },
      });
      console.log(`  ✓ Example Report: ${report3.publicReference} (RESOLVED)`);
    }

    // Example Incident
    const existingIncident = await prisma.incident.findFirst({
      where: { title: "Bole Cameroon Corridor Roadway & Drainage Works" },
    });
    if (!existingIncident && report1 && report3) {
      const incident = await prisma.incident.create({
        data: {
          organizationId: municipality.id,
          categoryId: roadsCatId,
          title: "Bole Cameroon Corridor Roadway & Drainage Works",
          description: "Coordinated municipal works covering roadway asphalt and drainage culvert.",
          status: ReportStatus.IN_PROGRESS,
          severity: Severity.HIGH,
          latitude: 8.9984,
          longitude: 38.7865,
          formattedAddress: "Cameroon Street Corridor, Bole Sub-City, Addis Ababa",
          reportCount: 2,
        },
      });

      await prisma.incidentReport.createMany({
        data: [
          { incidentId: incident.id, reportId: report1.id, relationshipType: IncidentRelationshipType.PRIMARY },
          { incidentId: incident.id, reportId: report3.id, relationshipType: IncidentRelationshipType.RELATED },
        ],
      });
      console.log(`  ✓ Example Incident: ${incident.title}`);
    }

    // Example Notifications
    const existingNotif = await prisma.notification.findFirst({
      where: { userId: citizenId },
    });
    if (!existingNotif) {
      await prisma.notification.createMany({
        data: [
          {
            userId: citizenId,
            type: "REPORT_VERIFIED",
            title: "Report #CHI-2026-000001 Verified",
            body: "Authorities have verified your report and scheduled work crews.",
            data: { publicReference: "CHI-2026-000001" },
          },
          {
            userId: citizenId,
            type: "REPORT_RESOLVED",
            title: "Report #CHI-2026-000003 Resolved",
            body: "Drainage blockage cleared by field crew. Please confirm if fixed.",
            data: { publicReference: "CHI-2026-000003" },
          },
        ],
      });
      console.log(`  ✓ Example Notifications seeded for demo citizen`);
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
