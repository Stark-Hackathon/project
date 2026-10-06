/**
 * Chigir Ale - Nearby Issues & Geodetic Distance Service
 * Spec: Section 23 — Nearby Issues
 * Calculates distances and identifies nearby reports within a geographic radius.
 */
import { prisma } from "@/lib/db/prisma";

export interface NearbyReportItem {
  id: string;
  publicReference: string;
  title: string;
  description: string;
  status: string;
  severity: string;
  latitude: number;
  longitude: number;
  formattedAddress: string | null;
  administrativeArea: string | null;
  reportedAt: Date;
  confirmationCount: number;
  upvoteCount: number;
  distanceMeters: number;
  distanceKm: number;
  category: {
    id: string;
    name: string;
    icon: string | null;
  };
}

export class NearbyIssuesService {
  /**
   * Earth radius in kilometers (mean radius)
   */
  private static readonly EARTH_RADIUS_KM = 6371;

  /**
   * Calculate great-circle distance between two points using the Haversine formula.
   * Returns distance in meters.
   */
  static calculateDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(NearbyIssuesService.EARTH_RADIUS_KM * c * 1000);
  }

  /**
   * Calculate distance in kilometers.
   */
  static calculateDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    return NearbyIssuesService.calculateDistanceMeters(lat1, lon1, lat2, lon2) / 1000;
  }

  /**
   * Find active reports within a given radius (in kilometers) from a coordinate.
   * Filters out CLOSED or REJECTED reports by default.
   */
  static async findNearbyReports(
    latitude: number,
    longitude: number,
    radiusKm = 5,
    categoryId?: string
  ): Promise<NearbyReportItem[]> {
    // 1 degree latitude ~ 111km; rough bounding box filter for fast DB index scan
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180));

    const candidates = await prisma.report.findMany({
      where: {
        deletedAt: null,
        status: {
          notIn: ["CLOSED", "REJECTED", "CANCELLED"],
        },
        latitude: {
          gte: latitude - latDelta,
          lte: latitude + latDelta,
        },
        longitude: {
          gte: longitude - Math.abs(lngDelta),
          lte: longitude + Math.abs(lngDelta),
        },
        categoryId: categoryId || undefined,
      },
      select: {
        id: true,
        publicReference: true,
        title: true,
        description: true,
        status: true,
        severity: true,
        latitude: true,
        longitude: true,
        formattedAddress: true,
        administrativeArea: true,
        reportedAt: true,
        confirmationCount: true,
        upvoteCount: true,
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
      take: 100,
    });

    const maxMeters = radiusKm * 1000;
    const nearby: NearbyReportItem[] = [];

    for (const report of candidates) {
      if (report.latitude === null || report.longitude === null) continue;

      const distMeters = NearbyIssuesService.calculateDistanceMeters(
        latitude,
        longitude,
        report.latitude,
        report.longitude
      );

      if (distMeters <= maxMeters) {
        nearby.push({
          id: report.id,
          publicReference: report.publicReference,
          title: report.title,
          description: report.description,
          status: report.status,
          severity: report.severity,
          latitude: report.latitude,
          longitude: report.longitude,
          formattedAddress: report.formattedAddress,
          administrativeArea: report.administrativeArea,
          reportedAt: report.reportedAt,
          confirmationCount: report.confirmationCount,
          upvoteCount: report.upvoteCount,
          distanceMeters: distMeters,
          distanceKm: Number((distMeters / 1000).toFixed(2)),
          category: report.category,
        });
      }
    }

    // Sort by nearest first
    return nearby.sort((a, b) => a.distanceMeters - b.distanceMeters);
  }
}
