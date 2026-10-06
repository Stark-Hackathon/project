/**
 * Chigir Ale - System Health & Telemetry API Route
 * Spec: Section 158 — Monitoring Alerts & System Health
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { JobQueueService } from "@/server/services/job-queue.service";
import { MonitoringService } from "@/server/services/monitoring.service";

export async function GET() {
  let dbStatus = "connected";
  try {
    // Quick probe with timeout
    await prisma.$queryRaw`SELECT 1`;
    MonitoringService.setDatabaseHealth(true);
  } catch {
    dbStatus = "unreachable";
    MonitoringService.setDatabaseHealth(false);
  }

  const activeAlerts = MonitoringService.evaluateAlerts();
  const queueStats = JobQueueService.getStats();

  const isCritical = activeAlerts.some((a) => a.severity === "CRITICAL");
  const isWarning = activeAlerts.length > 0;

  let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy";
  if (isCritical || dbStatus === "unreachable") {
    overallStatus = "unhealthy";
  } else if (isWarning) {
    overallStatus = "degraded";
  }

  return NextResponse.json(
    {
      status: overallStatus,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: dbStatus,
      queue: queueStats,
      telemetry: {
        p95LatencyMs: MonitoringService.getP95Latency(),
        errorRatePercent: MonitoringService.getErrorRatePercent(),
      },
      activeAlerts,
    },
    { status: overallStatus === "unhealthy" ? 503 : 200 }
  );
}
