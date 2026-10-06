/**
 * Chigir Ale — Production Release Verification Script
 * Spec: Section 166 (Production Readiness Checklist) & Section 174 (Master Acceptance Criteria)
 *
 * Runs automated pre-flight checks validating environment templates, core documentation,
 * database models, and production readiness criteria before deployment.
 */
import fs from "node:fs";
import path from "node:path";
import { ProductionReadinessService } from "../src/server/services/production-readiness.service";

interface CheckResult {
  category: string;
  item: string;
  passed: boolean;
  notes?: string;
}

const results: CheckResult[] = [];

function check(category: string, item: string, passed: boolean, notes?: string) {
  results.push({ category, item, passed, notes });
}

console.log("🔍 Running Chigir Ale Pre-Release Verification …\n");

// 1. Documentation Verification (Spec §162)
const requiredDocs = [
  "README.md",
  "ARCHITECTURE.md",
  "DATABASE.md",
  "API.md",
  "SECURITY.md",
  "DEPLOYMENT.md",
  "CONTRIBUTING.md",
  "docs/UI_DESIGN_SYSTEM.md",
  "docs/ACCEPTANCE_VERIFICATION.md",
];

const rootDir = path.resolve(__dirname, "..");

for (const doc of requiredDocs) {
  const fullPath = path.join(rootDir, doc);
  const exists = fs.existsSync(fullPath);
  check("Documentation", `File exists: ${doc}`, exists, exists ? "Found" : "MISSING");
}

// 2. Environment Configuration Verification (Spec §104)
const envExamplePath = path.join(rootDir, ".env.example");
const envExampleExists = fs.existsSync(envExamplePath);
check("Environment", ".env.example exists", envExampleExists);

if (envExampleExists) {
  const envContent = fs.readFileSync(envExamplePath, "utf-8");
  const requiredEnvVars = [
    "DATABASE_URL",
    "AUTH_SECRET",
    "APP_URL",
    "STORAGE_ENDPOINT",
    "STORAGE_BUCKET",
    "STORAGE_ACCESS_KEY",
    "STORAGE_SECRET_KEY",
    "MAP_API_KEY",
    "AI_API_KEY",
    "VOICE_API_KEY",
    "PUSH_CONFIG",
    "EMAIL_CONFIG",
  ];

  for (const envVar of requiredEnvVars) {
    const hasVar = envContent.includes(envVar);
    check("Environment", `Defines ${envVar}`, hasVar, hasVar ? "Configured" : "MISSING");
  }
}

// 3. Schema & Database Models Verification
const schemaPath = path.join(rootDir, "prisma", "schema.prisma");
const schemaExists = fs.existsSync(schemaPath);
check("Database Schema", "schema.prisma exists", schemaExists);

if (schemaExists) {
  const schemaContent = fs.readFileSync(schemaPath, "utf-8");
  const coreModels = [
    "model User",
    "model Organization",
    "model Membership",
    "model Department",
    "model Report",
    "model ReportMedia",
    "model ReportEvent",
    "model Assignment",
    "model Incident",
    "model AuditLog",
    "model OutboxEvent",
    "model IdempotencyKey",
  ];

  for (const model of coreModels) {
    const hasModel = schemaContent.includes(model);
    check("Database Schema", `Contains ${model}`, hasModel, hasModel ? "Verified" : "MISSING");
  }
}

// 4. Production Readiness Evaluator (Spec §166)
const readiness = ProductionReadinessService.evaluateReadiness();
check(
  "Production Readiness",
  "25-point Production Readiness Checklist",
  readiness.overallStatus === "READY" && readiness.readinessPercentage === 100,
  `${readiness.passedCount}/${readiness.totalCount} items passed (${readiness.readinessPercentage}%)`
);

// -----------------------------------------------------------------------------
// Summary & Exit
// -----------------------------------------------------------------------------
console.log("----------------------------------------------------------------------");
console.log(String("CATEGORY").padEnd(24) + String("CHECK").padEnd(36) + "STATUS");
console.log("----------------------------------------------------------------------");

let failedCount = 0;
for (const r of results) {
  const statusStr = r.passed ? "✅ PASS" : "❌ FAIL";
  if (!r.passed) failedCount++;
  console.log(
    r.category.padEnd(24) +
      r.item.padEnd(36) +
      statusStr +
      (r.notes ? ` (${r.notes})` : "")
  );
}
console.log("----------------------------------------------------------------------");

if (failedCount === 0) {
  console.log(`\n🎉 RELEASE CHECK PASSED: All ${results.length} release criteria satisfied!`);
  console.log("The application is certified ready for release deployment.\n");
  process.exit(0);
} else {
  console.error(`\n❌ RELEASE CHECK FAILED: ${failedCount} criteria failed. Address before releasing.\n`);
  process.exit(1);
}
