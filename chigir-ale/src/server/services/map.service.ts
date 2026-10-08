/**
 * Chigir Ale - Map & Location Intelligence Service
 * Spec: Sections 39 (Maps Abstraction), 40 (Infrastructure Map), 18 (Location Privacy)
 * Implements geocoding, reverse geocoding, privacy jitter for citizen mode,
 * spatial clustering, and radius filtering.
 */
import { NearbyIssuesService } from "@/server/services/nearby-issues.service";
import type { Severity, ReportStatus } from "@prisma/client";

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  administrativeArea: string;
  confidence: number;
}

export interface MapPoint {
  id: string;
  publicReference: string;
  title: string;
  latitude: number;
  longitude: number;
  severity: Severity;
  status: ReportStatus;
  category: { id: string; name: string; slug: string; icon: string | null };
  confirmationCount: number;
  upvoteCount: number;
  formattedAddress?: string | null;
  administrativeArea?: string | null;
  createdAt: Date | string;
}

export interface MapCluster {
  id: string;
  centerLatitude: number;
  centerLongitude: number;
  count: number;
  criticalCount: number;
  highCount: number;
  dominantCategory: string;
  points: MapPoint[];
}

export interface ClusteredMapData {
  clusters: MapCluster[];
  singletons: MapPoint[];
  totalPoints: number;
}

// Addis Ababa Sub-Cities & Landmark Database for offline & resilient civic geocoding
const ADDIS_LOCATIONS: Array<{
  name: string;
  subcity: string;
  latitude: number;
  longitude: number;
  aliases: string[];
}> = [
  { name: "Bole Medhanialem", subcity: "Bole", latitude: 8.9984, longitude: 38.7865, aliases: ["medhanialem", "cameroon street", "atlas"] },
  { name: "Bole Airport", subcity: "Bole", latitude: 8.9779, longitude: 38.7993, aliases: ["airport", "terminal", "cargo"] },
  { name: "Meskel Square", subcity: "Kirkos", latitude: 9.0108, longitude: 38.7616, aliases: ["meskel", "stadium", "exhibition center"] },
  { name: "Kazanchis", subcity: "Kirkos", latitude: 9.0189, longitude: 38.7699, aliases: ["eca", "un-eca", "intercontinental"] },
  { name: "Piazza", subcity: "Arada", latitude: 9.0345, longitude: 38.7525, aliases: ["piassa", "de Gaulle", "churchill"] },
  { name: "4 Kilo", subcity: "Arada", latitude: 9.0348, longitude: 38.7628, aliases: ["arat kilo", "parliament", "aau campus"] },
  { name: "6 Kilo", subcity: "Yeka", latitude: 9.0475, longitude: 38.7621, aliases: ["sidist kilo", "national museum"] },
  { name: "Megenagna", subcity: "Yeka", latitude: 9.0201, longitude: 38.8021, aliases: ["lem hotel", "shola", "marathon"] },
  { name: "Ayat", subcity: "Lemi Kura", latitude: 9.0205, longitude: 38.845, aliases: ["ayat zone", "tafo", "cmc"] },
  { name: "Merkato", subcity: "Addis Ketema", latitude: 9.0321, longitude: 38.7354, aliases: ["autobus tera", "military tera", "bomb tera"] },
  { name: "Lideta Cathedral", subcity: "Lideta", latitude: 9.0112, longitude: 38.7365, aliases: ["lideta", "balcha hospital", "mexico square"] },
  { name: "Mexico Square", subcity: "Kirkos", latitude: 9.0121, longitude: 38.7454, aliases: ["mexico", "kera", "sarbet"] },
  { name: "Sarbet", subcity: "Nifas Silk-Lafto", latitude: 8.9954, longitude: 38.7323, aliases: ["african union", "au headquarters", "bisrate gabriel"] },
  { name: "Gotera Interchange", subcity: "Kirkos", latitude: 8.9867, longitude: 38.7543, aliases: ["gotera", "nations and nationalities", "agona"] },
  { name: "Tor Hailoch", subcity: "Kolfe Keranio", latitude: 9.0156, longitude: 38.7189, aliases: ["armed forces hospital", "total", "ayertena"] },
  { name: "Gulele Botanical", subcity: "Gulele", latitude: 9.0621, longitude: 38.7291, aliases: ["gulele", "shiromeda", "entoto"] },
  { name: "Kality Center", subcity: "Akaky Kaliti", latitude: 8.8872, longitude: 38.7612, aliases: ["kality", "akaki", "customs"] },
];

export class MapService {
  /**
   * Geocode a text query to geographic coordinates (Spec Section 39).
   */
  static async geocode(query: string): Promise<GeocodingResult[]> {
    const clean = query.trim().toLowerCase();
    if (!clean) return [];

    const results: GeocodingResult[] = [];

    for (const loc of ADDIS_LOCATIONS) {
      let matched = false;
      let score = 0;

      if (loc.name.toLowerCase().includes(clean) || clean.includes(loc.name.toLowerCase())) {
        matched = true;
        score = 0.9;
      } else if (loc.subcity.toLowerCase().includes(clean) || clean.includes(loc.subcity.toLowerCase())) {
        matched = true;
        score = 0.75;
      } else {
        for (const alias of loc.aliases) {
          if (clean.includes(alias) || alias.includes(clean)) {
            matched = true;
            score = 0.8;
            break;
          }
        }
      }

      if (matched) {
        results.push({
          latitude: loc.latitude,
          longitude: loc.longitude,
          formattedAddress: `${loc.name}, ${loc.subcity} Sub-City, Addis Ababa, Ethiopia`,
          administrativeArea: `${loc.subcity} Sub-City`,
          confidence: score,
        });
      }
    }

    // Default to central Addis Ababa if no exact keyword matched
    if (results.length === 0) {
      results.push({
        latitude: 9.0108,
        longitude: 38.7616,
        formattedAddress: `${query}, Addis Ababa, Ethiopia`,
        administrativeArea: "Addis Ababa",
        confidence: 0.5,
      });
    }

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Reverse geocode coordinates to the nearest neighborhood landmark and subcity.
   */
  static async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult> {
    let closest = ADDIS_LOCATIONS[0]!;
    let minDistance = Infinity;

    for (const loc of ADDIS_LOCATIONS) {
      const dist = NearbyIssuesService.calculateDistanceKm(
        latitude,
        longitude,
        loc.latitude,
        loc.longitude
      );
      if (dist < minDistance) {
        minDistance = dist;
        closest = loc;
      }
    }

    const distanceStr =
      minDistance < 0.2
        ? "Near"
        : `${Math.round(minDistance * 10) / 10}km from`;

    return {
      latitude,
      longitude,
      formattedAddress: `${distanceStr} ${closest.name}, ${closest.subcity} Sub-City, Addis Ababa`,
      administrativeArea: `${closest.subcity} Sub-City`,
      confidence: Math.max(0.6, 1.0 - minDistance / 10),
    };
  }

  /**
   * Location Privacy Mask (Spec Section 18 — Location Privacy).
   * Generates approximate coordinates for public citizen views, preventing
   * exact residential door identification while maintaining district validity.
   */
  static toPublicCoordinate(
    latitude: number,
    longitude: number,
    reportId?: string
  ): { latitude: number; longitude: number; isApproximate: boolean } {
    // Round to 3 decimal places (~110m resolution) with deterministic slight jitter
    const precision = 1000;
    const roundedLat = Math.round(latitude * precision) / precision;
    const roundedLng = Math.round(longitude * precision) / precision;

    // Use reportId seed if provided for consistent map rendering
    let jitterOffset = 0.0003; // ~30 meters
    if (reportId) {
      let hash = 0;
      for (let i = 0; i < reportId.length; i++) {
        hash = (hash << 5) - hash + reportId.charCodeAt(i);
        hash |= 0;
      }
      const pseudoRandom = (Math.abs(hash) % 100) / 100;
      jitterOffset = (pseudoRandom - 0.5) * 0.0008;
    }

    return {
      latitude: Number((roundedLat + jitterOffset).toFixed(4)),
      longitude: Number((roundedLng + jitterOffset).toFixed(4)),
      isApproximate: true,
    };
  }

  /**
   * Spatial clustering engine (Spec Section 39 & 40).
   * Groups geographically proximate points within a radius threshold into clusters.
   */
  static clusterPoints(points: MapPoint[], clusterRadiusKm = 0.8): ClusteredMapData {
    if (points.length === 0) {
      return { clusters: [], singletons: [], totalPoints: 0 };
    }

    const unvisited = new Set<string>(points.map((p) => p.id));

    const clusters: MapCluster[] = [];
    const singletons: MapPoint[] = [];

    let clusterIndex = 1;

    for (const point of points) {
      if (!unvisited.has(point.id)) continue;
      unvisited.delete(point.id);

      // Find neighbors within clusterRadiusKm
      const neighbors: MapPoint[] = [];
      for (const other of points) {
        if (other.id === point.id || !unvisited.has(other.id)) continue;
        const dist = NearbyIssuesService.calculateDistanceKm(
          point.latitude,
          point.longitude,
          other.latitude,
          other.longitude
        );
        if (dist <= clusterRadiusKm) {
          neighbors.push(other);
        }
      }

      if (neighbors.length >= 1) {
        // Form a cluster with point + neighbors
        const clusterPointsList = [point, ...neighbors];
        neighbors.forEach((n) => unvisited.delete(n.id));

        // Compute centroid
        const avgLat =
          clusterPointsList.reduce((sum, p) => sum + p.latitude, 0) / clusterPointsList.length;
        const avgLng =
          clusterPointsList.reduce((sum, p) => sum + p.longitude, 0) / clusterPointsList.length;

        // Count categories and severities
        let criticalCount = 0;
        let highCount = 0;
        const categoryFreq: Record<string, number> = {};

        for (const p of clusterPointsList) {
          if (p.severity === "CRITICAL") criticalCount++;
          if (p.severity === "HIGH") highCount++;
          const catName = p.category.name;
          categoryFreq[catName] = (categoryFreq[catName] ?? 0) + 1;
        }

        let dominantCategory = point.category.name;
        let maxFreq = 0;
        for (const [cat, freq] of Object.entries(categoryFreq)) {
          if (freq > maxFreq) {
            maxFreq = freq;
            dominantCategory = cat;
          }
        }

        clusters.push({
          id: `cluster-${clusterIndex++}`,
          centerLatitude: Number(avgLat.toFixed(5)),
          centerLongitude: Number(avgLng.toFixed(5)),
          count: clusterPointsList.length,
          criticalCount,
          highCount,
          dominantCategory,
          points: clusterPointsList,
        });
      } else {
        singletons.push(point);
      }
    }

    return {
      clusters,
      singletons,
      totalPoints: points.length,
    };
  }

  /**
   * Resilient fallback incidents for offline demo & zero-state reliability.
   */
  static getFallbackPoints(): MapPoint[] {
    return [
      {
        id: "demo-rep-1",
        publicReference: "CHI-2026-000001",
        title: "Major Pothole on Bole Road",
        latitude: 8.9984,
        longitude: 38.7865,
        severity: "CRITICAL",
        status: "VERIFIED",
        category: { id: "roads", name: "Roads & Potholes", slug: "roads", icon: "🛣️" },
        confirmationCount: 14,
        upvoteCount: 28,
        formattedAddress: "Near Medhanialem Mall, Bole Road, Addis Ababa",
        administrativeArea: "Bole Sub-City",
        createdAt: new Date().toISOString(),
      },
      {
        id: "demo-rep-2",
        publicReference: "CHI-2026-000002",
        title: "High-Pressure Water Pipe Burst",
        latitude: 8.995,
        longitude: 38.783,
        severity: "HIGH",
        status: "ASSIGNED",
        category: { id: "water", name: "Water & Leaks", slug: "water", icon: "💧" },
        confirmationCount: 19,
        upvoteCount: 35,
        formattedAddress: "Cameroon Street, Bole, Addis Ababa",
        administrativeArea: "Bole Sub-City",
        createdAt: new Date().toISOString(),
      },
      {
        id: "demo-rep-3",
        publicReference: "CHI-2026-000003",
        title: "Uncovered Storm Drain Hazard",
        latitude: 9.0108,
        longitude: 38.7616,
        severity: "CRITICAL",
        status: "IN_PROGRESS",
        category: { id: "drainage", name: "Drainage", slug: "drainage", icon: "🌊" },
        confirmationCount: 22,
        upvoteCount: 41,
        formattedAddress: "Meskel Square North Walkway, Addis Ababa",
        administrativeArea: "Kirkos Sub-City",
        createdAt: new Date().toISOString(),
      },
      {
        id: "demo-rep-4",
        publicReference: "CHI-2026-000004",
        title: "Solid Waste Overflow at Dumpster",
        latitude: 8.9892,
        longitude: 38.758,
        severity: "MEDIUM",
        status: "SUBMITTED",
        category: { id: "waste-management", name: "Waste Management", slug: "waste-management", icon: "🗑️" },
        confirmationCount: 8,
        upvoteCount: 12,
        formattedAddress: "Olympia Roundabout, Kirkos, Addis Ababa",
        administrativeArea: "Kirkos Sub-City",
        createdAt: new Date().toISOString(),
      },
      {
        id: "demo-rep-5",
        publicReference: "CHI-2026-000005",
        title: "Faulty Traffic Signal at Intersection",
        latitude: 9.0345,
        longitude: 38.7525,
        severity: "HIGH",
        status: "VERIFIED",
        category: { id: "traffic-infrastructure", name: "Traffic Signals", slug: "traffic-infrastructure", icon: "🚦" },
        confirmationCount: 15,
        upvoteCount: 26,
        formattedAddress: "De Gaulle Square, Piazza, Addis Ababa",
        administrativeArea: "Arada Sub-City",
        createdAt: new Date().toISOString(),
      },
      {
        id: "demo-rep-6",
        publicReference: "CHI-2026-000006",
        title: "Fallen Streetlight Pole & Exposed Wires",
        latitude: 9.0201,
        longitude: 38.8021,
        severity: "HIGH",
        status: "UNDER_REVIEW",
        category: { id: "streetlights", name: "Streetlights", slug: "streetlights", icon: "💡" },
        confirmationCount: 9,
        upvoteCount: 17,
        formattedAddress: "Near Shola Market, Megenagna, Addis Ababa",
        administrativeArea: "Yeka Sub-City",
        createdAt: new Date().toISOString(),
      },
      {
        id: "demo-rep-7",
        publicReference: "CHI-2026-000007",
        title: "Damaged Pedestrian Overpass Steps",
        latitude: 9.0189,
        longitude: 38.7699,
        severity: "MEDIUM",
        status: "VERIFIED",
        category: { id: "roads", name: "Roads & Potholes", slug: "roads", icon: "🛣️" },
        confirmationCount: 11,
        upvoteCount: 18,
        formattedAddress: "ECA Junction, Kazanchis, Addis Ababa",
        administrativeArea: "Kirkos Sub-City",
        createdAt: new Date().toISOString(),
      },
      {
        id: "demo-rep-8",
        publicReference: "CHI-2026-000008",
        title: "Subsurface Water Seepage & Road Sinking",
        latitude: 9.0321,
        longitude: 38.7354,
        severity: "CRITICAL",
        status: "UNDER_REVIEW",
        category: { id: "water", name: "Water & Leaks", slug: "water", icon: "💧" },
        confirmationCount: 16,
        upvoteCount: 30,
        formattedAddress: "Autobus Tera, Merkato, Addis Ababa",
        administrativeArea: "Addis Ketema Sub-City",
        createdAt: new Date().toISOString(),
      },
    ];
  }
}
