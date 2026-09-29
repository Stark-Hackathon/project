import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CORE_LIFECYCLE_STEPS, USER_ROLES, ok, err } from "@/types";
import { cn } from "@/lib/utils";

describe("Iteration 0: Engineering Baseline & Domain Types", () => {
  it("should define the complete 8-step core incident lifecycle", () => {
    assert.deepEqual(CORE_LIFECYCLE_STEPS, [
      "SEE",
      "REPORT",
      "LOCATE",
      "VERIFY",
      "ASSIGN",
      "FIX",
      "CONFIRM",
      "LEARN",
    ]);
  });

  it("should define core platform roles according to specification", () => {
    assert.ok(USER_ROLES.includes("CITIZEN"));
    assert.ok(USER_ROLES.includes("AUTHORITY_STAFF"));
    assert.ok(USER_ROLES.includes("FIELD_WORKER"));
    assert.ok(USER_ROLES.includes("ORGANIZATION_ADMIN"));
    assert.ok(USER_ROLES.includes("SYSTEM_ADMIN"));
  });

  it("should support Result type ok and err constructs", () => {
    const successResult = ok({ reportId: "rep-123" });
    assert.equal(successResult.success, true);
    if (successResult.success) {
      assert.equal(successResult.data.reportId, "rep-123");
    }

    const failureResult = err(new Error("Unauthorized"));
    assert.equal(failureResult.success, false);
    if (!failureResult.success) {
      assert.equal(failureResult.error.message, "Unauthorized");
    }
  });

  it("should correctly merge tailwind classes with cn utility", () => {
    const className = cn("px-4 py-2", "px-6", { "bg-emerald-500": true, "bg-red-500": false });
    assert.equal(className, "py-2 px-6 bg-emerald-500");
  });
});
