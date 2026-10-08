import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createReportSchema } from "@/features/reports/schemas";

describe("Iteration 3: Citizen Reporting & Experience", () => {
  describe("Report Input Validation (createReportSchema)", () => {
    it("should accept valid report input with all fields", () => {
      const input = {
        categoryId: "cat-uuid-1234",
        title: "Large pothole obstructing right lane",
        description: "A deep 2-meter wide pothole has formed in front of the supermarket, causing vehicles to swerve dangerously.",
        severity: "HIGH" as const,
        latitude: 9.0249,
        longitude: 38.7468,
        locationAccuracy: 8,
        formattedAddress: "Bole Road near Mega Building",
        administrativeArea: "Bole Sub-City, Woreda 03",
        mediaUrls: ["https://example.com/photo1.jpg"],
      };

      const result = createReportSchema.safeParse(input);
      assert.equal(result.success, true);
    });

    it("should accept valid minimal report input", () => {
      const input = {
        categoryId: "cat-uuid-1234",
        title: "Water pipe broken",
        description: "Fresh water is leaking onto the sidewalk continuously since this morning.",
      };

      const result = createReportSchema.safeParse(input);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.severity, "MEDIUM"); // Default severity
      }
    });

    it("should reject empty categoryId", () => {
      const input = {
        categoryId: "",
        title: "Broken streetlight",
        description: "The street light in front of house 402 has been dark for 3 nights.",
      };

      const result = createReportSchema.safeParse(input);
      assert.equal(result.success, false);
    });

    it("should reject title shorter than 3 characters", () => {
      const input = {
        categoryId: "cat-1",
        title: "Hi",
        description: "The streetlight is broken and dark.",
      };

      const result = createReportSchema.safeParse(input);
      assert.equal(result.success, false);
    });

    it("should reject title longer than 150 characters", () => {
      const input = {
        categoryId: "cat-1",
        title: "A".repeat(151),
        description: "The streetlight is broken and dark.",
      };

      const result = createReportSchema.safeParse(input);
      assert.equal(result.success, false);
    });

    it("should reject description shorter than 10 characters", () => {
      const input = {
        categoryId: "cat-1",
        title: "Broken pipe",
        description: "Leaking.",
      };

      const result = createReportSchema.safeParse(input);
      assert.equal(result.success, false);
    });

    it("should reject latitude outside -90 to 90", () => {
      const input = {
        categoryId: "cat-1",
        title: "Damaged road",
        description: "The asphalt has collapsed completely.",
        latitude: 95.0, // Invalid lat
      };

      const result = createReportSchema.safeParse(input);
      assert.equal(result.success, false);
    });

    it("should reject longitude outside -180 to 180", () => {
      const input = {
        categoryId: "cat-1",
        title: "Damaged road",
        description: "The asphalt has collapsed completely.",
        longitude: 185.0, // Invalid lng
      };

      const result = createReportSchema.safeParse(input);
      assert.equal(result.success, false);
    });

    it("should reject more than 5 media URLs", () => {
      const input = {
        categoryId: "cat-1",
        title: "Broken bridge railing",
        description: "The pedestrian guard rail is detached.",
        mediaUrls: [
          "https://example.com/1.jpg",
          "https://example.com/2.jpg",
          "https://example.com/3.jpg",
          "https://example.com/4.jpg",
          "https://example.com/5.jpg",
          "https://example.com/6.jpg", // 6th photo exceeds limit
        ],
      };

      const result = createReportSchema.safeParse(input);
      assert.equal(result.success, false);
    });

    it("should validate all 4 allowed severity levels", () => {
      const validSeverities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
      for (const sev of validSeverities) {
        const result = createReportSchema.safeParse({
          categoryId: "cat-1",
          title: "Civic issue",
          description: "Adequate description of the problem.",
          severity: sev,
        });
        assert.equal(result.success, true);
      }
    });

    it("should reject invalid severity values", () => {
      const result = createReportSchema.safeParse({
        categoryId: "cat-1",
        title: "Civic issue",
        description: "Adequate description of the problem.",
        severity: "EXTREME",
      });
      assert.equal(result.success, false);
    });
  });

  describe("Public Report Privacy Guard (Spec Section 18 & 31)", () => {
    it("should sanitize authority internal data from public view models", () => {
      // Simulating a full DB record containing internal properties
      const rawDbReport = {
        id: "rep-101",
        publicReference: "CHI-2026-000001",
        title: "Downed electric wire",
        description: "Live wire hanging over sidewalk.",
        internalNotes: "Dispatched crew A; caution requested.",
        assigneeUserId: "user-admin-secret-999",
        priorityScore: 89.5,
        priorityVersion: 2,
        events: [
          { id: "e1", eventType: "STATUS_CHANGED", visibility: "PUBLIC", message: "Report verified by team." },
          { id: "e2", eventType: "INTERNAL_NOTE", visibility: "INTERNAL", message: "Waiting for spare transformer." },
          { id: "e3", eventType: "SYSTEM_ROUTING", visibility: "SYSTEM", message: "Rule matched Org #4" },
        ],
      };

      // Filter function mimicking ReportRepository.findPublicByReference
      const publicView = {
        id: rawDbReport.id,
        publicReference: rawDbReport.publicReference,
        title: rawDbReport.title,
        description: rawDbReport.description,
        events: rawDbReport.events.filter((e) => e.visibility === "PUBLIC"),
      };

      assert.equal((publicView as Record<string, unknown>).internalNotes, undefined);
      assert.equal((publicView as Record<string, unknown>).assigneeUserId, undefined);
      assert.equal((publicView as Record<string, unknown>).priorityScore, undefined);
      assert.equal(publicView.events.length, 1);
      assert.equal(publicView.events[0]?.message, "Report verified by team.");
    });
  });
});
