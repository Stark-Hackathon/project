/**
 * Chigir Ale - Hotspot Detection Service
 * Spec: Section 95 — Hotspot Detection
 * Algorithmic, transparent detection of geographic & category infrastructure clusters.
 */
import { prisma } from "@/lib/db/prisma";

export interface InfrastructureHotspot {
  id: string;
  area: string;
  categoryName: string;
  categoryId: string;
  reportCount: number;
  criticalCount: number;
  highCount: number;
  periodDays: number;
  trend: "INCREASING" | "STABLE" | "DECREASING";
  severityScore: number;
  centroidLatitude: number;
  centroidLongitude: number;
  calculationExplanation: string;
}

export class HotspotService {
  /**
   * Detect infrastructure hotspots across the city.
   * Spec Section 95:
   * Combines geographic area, category density, time windows, and severity weighting.
   * Compares the first half of the time window against the second half to compute trend.
   */
  static async detectHotspots(options: {
    days?: number;
    minCount?: number;
    categoryId?: string;
    subcity?: string;
  } = {}): Promise<InfrastructureHotspot[]> {
    const days = options.days ?? 30;
    const minCount = options.minCount ?? 2;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    // Halfway cutoff for trend determination
    const midpointDate = new Date();
    midpointDate.setDate(midpointDate.getDate() - Math.floor(days / 2));

    const reports = await prisma.report.findMany({
      where: {
        deletedAt: null,
        createdAt: { gte: sinceDate },
        ...(options.categoryId ? { categoryId: options.categoryId } : {}),
        ...(options.subcity ? { administrativeArea: options.subcity } : {}),
      },
      select: {
        id: true,
        administrativeArea: true,
        categoryId: true,
        category: { select: { id: true, name: true } },
        severity: true,
        latitude: true,
        longitude: true,
        confirmationCount: true,
        createdAt: true,
      },
    });

    if (reports.length === 0) {
      return [];
    }

    // Group by (administrativeArea + categoryId)
    const groups = new Map<
      string,
      {
        area: string;
        categoryId: string;
        categoryName: string;
        reports: typeof reports;
        firstHalfCount: number;
        secondHalfCount: number;
      }
    >();

    for (const r of reports) {
      const area = r.administrativeArea || "Addis Ababa General";
      const key = `${area}:::${r.categoryId}`;

      if (!groups.has(key)) {
        groups.set(key, {
          area,
          categoryId: r.categoryId,
          categoryName: r.category.name,
          reports: [],
          firstHalfCount: 0,
          secondHalfCount: 0,
        });
      }

      const g = groups.get(key)!;
      g.reports.push(r);

      if (r.createdAt < midpointDate) {
        g.firstHalfCount++;
      } else {
        g.secondHalfCount++;
      }
    }

    const hotspots: InfrastructureHotspot[] = [];

    for (const [key, g] of groups.entries()) {
      if (g.reports.length < minCount) continue;

      let criticalCount = 0;
      let highCount = 0;
      let severityWeightedScore = 0;
      let latSum = 0;
      let lngSum = 0;
      let validCoords = 0;

      for (const r of g.reports) {
        if (r.severity === "CRITICAL") {
          criticalCount++;
          severityWeightedScore += 4;
        } else if (r.severity === "HIGH") {
          highCount++;
          severityWeightedScore += 3;
        } else if (r.severity === "MEDIUM") {
          severityWeightedScore += 2;
        } else {
          severityWeightedScore += 1;
        }

        severityWeightedScore += (r.confirmationCount ?? 0) * 0.5;

        if (r.latitude !== null && r.longitude !== null) {
          latSum += r.latitude;
          lngSum += r.longitude;
          validCoords++;
        }
      }

      // Compute Trend: compare second half (recent) to first half (older)
      let trend: "INCREASING" | "STABLE" | "DECREASING" = "STABLE";
      if (g.secondHalfCount > g.firstHalfCount * 1.25) {
        trend = "INCREASING";
      } else if (g.firstHalfCount > g.secondHalfCount * 1.25) {
        trend = "DECREASING";
      }

      // Default Addis Ababa center if coordinates missing
      const centroidLatitude = validCoords > 0 ? Number((latSum / validCoords).toFixed(4)) : 9.0108;
      const centroidLongitude = validCoords > 0 ? Number((lngSum / validCoords).toFixed(4)) : 38.7616;

      const explanation = `Hotspot flagged based on ${g.reports.length} ${g.categoryName} incidents in ${g.area} over ${days} days (${criticalCount} Critical, ${highCount} High). Activity is ${trend.toLowerCase()} (${g.firstHalfCount} in prior period vs. ${g.secondHalfCount} recent).`;

      hotspots.push({
        id: `hotspot-${key.replace(/[^a-zA-Z0-9]/g, "-")}`,
        area: g.area,
        categoryName: g.categoryName,
        categoryId: g.categoryId,
        reportCount: g.reports.length,
        criticalCount,
        highCount,
        periodDays: days,
        trend,
        severityScore: Number(severityWeightedScore.toFixed(1)),
        centroidLatitude,
        centroidLongitude,
        calculationExplanation: explanation,
      });
    }

    // Sort by severity score descending
    return hotspots.sort((a, b) => b.severityScore - a.severityScore);
  }
}
