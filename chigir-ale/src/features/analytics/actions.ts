"use server";

/**
 * Chigir Ale - Analytics Server Actions
 * Spec: Sections 94 (Analytics), 95 (Hotspots), 96 (Privacy), 121 (Transparency)
 */
import { requireAuthorityUser } from "@/lib/auth/session";
import { AnalyticsService } from "@/server/services/analytics.service";
import { HotspotService } from "@/server/services/hotspot.service";
import { ok, err } from "@/types/domain";

/**
 * Public civic transparency indicators (no authorization required).
 * Anonymized, aggregated city-wide metrics.
 */
export async function getPublicTransparencyAction() {
  try {
    const metrics = await AnalyticsService.getPublicTransparencyMetrics();
    return ok(metrics);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to load transparency metrics";
    return err(msg);
  }
}

/**
 * Operational analytics for authorities (requires authority user).
 */
export async function getOperationalAnalyticsAction(days = 30) {
  try {
    await requireAuthorityUser();
    const analytics = await AnalyticsService.getOperationalAnalytics({ days });
    return ok(analytics);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to load operational analytics";
    return err(msg);
  }
}

/**
 * Hotspot detection query.
 * Can be accessed by authorities or citizens (returns aggregated clusters).
 */
export async function getHotspotsAction(options: {
  days?: number;
  minCount?: number;
  categoryId?: string;
  subcity?: string;
} = {}) {
  try {
    const hotspots = await HotspotService.detectHotspots(options);
    return ok(hotspots);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to detect hotspots";
    return err(msg);
  }
}
