(process.env as Record<string, string | undefined>)["NODE_ENV"] = "test";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ProductionReadinessService } from "@/server/services/production-readiness.service";

describe("Iteration 14: Deployment, Documentation, Acceptance & Release", () => {
  const rootDir = path.resolve(__dirname, "../..");

  describe("Documentation Completeness (Spec §162 & §165)", () => {
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

    for (const doc of requiredDocs) {
      it(`should contain ${doc} with substantive content`, () => {
        const fullPath = path.join(rootDir, doc);
        assert.ok(fs.existsSync(fullPath), `Missing documentation file: ${doc}`);
        const content = fs.readFileSync(fullPath, "utf-8");
        assert.ok(content.length > 200, `Documentation file ${doc} is too brief or empty.`);
      });
    }
  });

  describe("Environment Configuration & Security (Spec §104)", () => {
    it("should provide .env.example with all mandated placeholders", () => {
      const envPath = path.join(rootDir, ".env.example");
      assert.ok(fs.existsSync(envPath));
      const content = fs.readFileSync(envPath, "utf-8");

      const requiredKeys = [
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

      for (const key of requiredKeys) {
        assert.ok(content.includes(key), `Missing required env variable: ${key}`);
      }
    });

    it("should never contain committed production secrets in example files", () => {
      const envPath = path.join(rootDir, ".env.example");
      const content = fs.readFileSync(envPath, "utf-8");
      assert.equal(content.includes("AKIA"), false); // No AWS real access keys
      assert.equal(content.includes("AIzaSy"), false); // No Google real keys
    });
  });

  describe("Containerization & Production Deployment (Spec §105 & §166)", () => {
    it("should include Dockerfile and docker-compose.yml for container deployment", () => {
      const dockerfilePath = path.join(rootDir, "Dockerfile");
      const composePath = path.join(rootDir, "docker-compose.yml");
      assert.ok(fs.existsSync(dockerfilePath));
      assert.ok(fs.existsSync(composePath));

      const dockerfileContent = fs.readFileSync(dockerfilePath, "utf-8");
      assert.ok(dockerfileContent.includes("node:22-alpine"));
      assert.ok(dockerfileContent.includes("prisma generate"));
      assert.ok(dockerfileContent.includes("npm run build"));
    });
  });

  describe("Master Acceptance Matrix (Spec §174)", () => {
    it("should verify that ProductionReadinessService reports 100% READY status", () => {
      const report = ProductionReadinessService.evaluateReadiness();
      assert.equal(report.overallStatus, "READY");
      assert.equal(report.readinessPercentage, 100);
      assert.ok(report.totalCount >= 25);
      assert.equal(report.passedCount, report.totalCount);
    });
  });
});
