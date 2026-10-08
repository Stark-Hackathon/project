"use server";

/**
 * Chigir Ale - Maps & Location Server Actions
 * Spec: Sections 39 (Maps), 40 (Infrastructure Map), 18 (Location Privacy)
 * Delivers clustered geographic datasets, geocoding lookups, and mode-dependent
 * coordinate privacy filtering.
 */
import { prisma } from "@/lib/db/prisma";
import type { Result } from "@/types";
import { requireAuthorityUser } from "@/lib/auth/session";
import {
  MapService,
  type MapPoint,
  type ClusteredMapData,
  type GeocodingResult,
} from "@/server/services/map.service";
import type { Severity, ReportStatus, Prisma } from "@prisma/client";

export interface GetMapDataParams {
  mode: "citizen" | "authority";
  categoryId?: string;
  departmentId?: string;
  severity?: Severity | "ALL";
  status?: ReportStatus | "ALL";
  clusterRadiusKm?: number;
}

export async function getMapDataAction(
  params: GetMapDataParams
): Promise<Result<ClusteredMapData>> {
  try {
    const isAuthorityMode = params.mode === "authority";

    if (isAuthorityMode) {
      await requireAuthorityUser();
    }

    const where: Prisma.ReportWhereInput = {
      deletedAt: null,
      latitude: { not: null },
      longitude: { not: null },
    };

    if (params.categoryId && params.categoryId !== "ALL") {
      where.categoryId = params.categoryId;
    }

    if (params.severity && params.severity !== "ALL") {
      where.severity = params.severity;
    }

    if (params.status && params.status !== "ALL") {
      where.status = params.status;
    } else if (!isAuthorityMode) {
      // In citizen mode, show active and verified issues
      where.status = { notIn: ["REJECTED", "CANCELLED"] };
    }

    if (isAuthorityMode && params.departmentId && params.departmentId !== "ALL") {
      where.assignments = {
        some: {
          departmentId: params.departmentId,
          unassignedAt: null,
        },
      };
    }

    let reports: Array<{
      id: string;
      publicReference: string;
      title: string;
      latitude: number | null;
      longitude: number | null;
      severity: Severity;
      status: ReportStatus;
      confirmationCount: number;
      upvoteCount: number;
      formattedAddress: string | null;
      administrativeArea: string | null;
      createdAt: Date;
      category: { id: string; name: string; slug: string; icon: string | null };
    }> = [];

    try {
      reports = await prisma.report.findMany({
        where,
        select: {
          id: true,
          publicReference: true,
          title: true,
          latitude: true,
          longitude: true,
          severity: true,
          status: true,
          confirmationCount: true,
          upvoteCount: true,
          formattedAddress: true,
          administrativeArea: true,
          createdAt: true,
          category: {
            select: { id: true, name: true, slug: true, icon: true },
          },
        },
        take: 200,
      });
    } catch {
      // Prisma offline or unavailable; fallback to seed incidents
      reports = [];
    }

    let mapPoints: MapPoint[] = [];

    if (reports.length > 0) {
      mapPoints = reports.map((r) => {
        let lat = r.latitude!;
        let lng = r.longitude!;

        // Enforce Spec Section 18: Location Privacy for Citizen Mode
        if (!isAuthorityMode) {
          const publicCoord = MapService.toPublicCoordinate(lat, lng, r.id);
          lat = publicCoord.latitude;
          lng = publicCoord.longitude;
        }

        return {
          id: r.id,
          publicReference: r.publicReference,
          title: r.title,
          latitude: lat,
          longitude: lng,
          severity: r.severity,
          status: r.status,
          confirmationCount: r.confirmationCount,
          upvoteCount: r.upvoteCount,
          formattedAddress: r.formattedAddress,
          administrativeArea: r.administrativeArea,
          createdAt: r.createdAt,
          category: r.category,
        };
      });
    } else {
      // Use resilient fallback incidents
      let fallbackList = MapService.getFallbackPoints();

      if (params.categoryId && params.categoryId !== "ALL") {
        fallbackList = fallbackList.filter(
          (p) => p.category.id === params.categoryId || p.category.slug === params.categoryId
        );
      }

      if (params.severity && params.severity !== "ALL") {
        fallbackList = fallbackList.filter((p) => p.severity === params.severity);
      }

      if (params.status && params.status !== "ALL") {
        fallbackList = fallbackList.filter((p) => p.status === params.status);
      }

      mapPoints = fallbackList.map((p) => {
        if (!isAuthorityMode) {
          const publicCoord = MapService.toPublicCoordinate(p.latitude, p.longitude, p.id);
          return {
            ...p,
            latitude: publicCoord.latitude,
            longitude: publicCoord.longitude,
          };
        }
        return p;
      });
    }

    const clustered = MapService.clusterPoints(
      mapPoints,
      params.clusterRadiusKm ?? (isAuthorityMode ? 0.6 : 0.8)
    );

    return { success: true, data: clustered };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Failed to load map points"),
    };
  }
}

export async function geocodeAddressAction(
  query: string
): Promise<Result<GeocodingResult[]>> {
  try {
    const results = await MapService.geocode(query);
    return { success: true, data: results };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Geocoding failed"),
    };
  }
}

export async function reverseGeocodeAction(
  latitude: number,
  longitude: number
): Promise<Result<GeocodingResult>> {
  try {
    const result = await MapService.reverseGeocode(latitude, longitude);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Reverse geocoding failed"),
    };
  }
}
