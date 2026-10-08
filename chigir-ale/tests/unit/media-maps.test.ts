import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { StorageService, ALLOWED_MIME_TYPES } from "@/server/services/storage.service";
import { MapService, type MapPoint } from "@/server/services/map.service";
import { NearbyIssuesService } from "@/server/services/nearby-issues.service";

describe("Iteration 6: Media, Maps, Storage & Location Intelligence", () => {
  describe("Storage Service & Evidence Validation (Spec Sections 77 & 78)", () => {
    it("should allow valid whitelisted MIME types within size limits", () => {
      const validJpeg = StorageService.validateFileInput("image/jpeg", 5 * 1024 * 1024);
      assert.equal(validJpeg.type, "IMAGE");

      const validPdf = StorageService.validateFileInput("application/pdf", 8 * 1024 * 1024);
      assert.equal(validPdf.type, "DOCUMENT");

      const validMp4 = StorageService.validateFileInput("video/mp4", 30 * 1024 * 1024);
      assert.equal(validMp4.type, "VIDEO");

      const validAudio = StorageService.validateFileInput("audio/webm", 2 * 1024 * 1024);
      assert.equal(validAudio.type, "AUDIO");
    });

    it("should reject disallowed MIME types", () => {
      assert.throws(
        () => StorageService.validateFileInput("application/x-sh", 1024),
        /UNSUPPORTED_MEDIA_TYPE/
      );
      assert.throws(
        () => StorageService.validateFileInput("text/html", 1024),
        /UNSUPPORTED_MEDIA_TYPE/
      );
      assert.throws(
        () => StorageService.validateFileInput("application/javascript", 1024),
        /UNSUPPORTED_MEDIA_TYPE/
      );
    });

    it("should reject files exceeding maximum size limits", () => {
      // Image exceeds 15MB
      assert.throws(
        () => StorageService.validateFileInput("image/jpeg", 16 * 1024 * 1024),
        /FILE_TOO_LARGE/
      );
      // Document exceeds 10MB
      assert.throws(
        () => StorageService.validateFileInput("application/pdf", 11 * 1024 * 1024),
        /FILE_TOO_LARGE/
      );
    });

    it("should generate safe, non-guessable storage keys without raw user names", () => {
      const key1 = StorageService.generateStorageKey("image/png");
      const key2 = StorageService.generateStorageKey("image/jpeg");

      assert.ok(key1.startsWith("evidence/"));
      assert.ok(key1.endsWith(".png"));
      assert.ok(key2.endsWith(".jpg"));
      assert.notEqual(key1, key2);
      // Key should not contain traversal characters
      assert.equal(key1.includes(".."), false);
      assert.equal(key1.includes("\\"), false);
    });

    it("should generate and verify signed upload tokens", () => {
      const storageKey = StorageService.generateStorageKey("image/jpeg");
      const userId = "user-123";
      const { token, expiresAt } = StorageService.createUploadToken(storageKey, userId, "image/jpeg", 300);

      assert.ok(token.length > 20);
      assert.ok(expiresAt.getTime() > Date.now());

      const verified = StorageService.verifyUploadToken(token);
      assert.equal(verified.storageKey, storageKey);
      assert.equal(verified.userId, userId);
      assert.equal(verified.mimeType, "image/jpeg");
    });

    it("should reject tampered upload tokens", () => {
      const storageKey = StorageService.generateStorageKey("image/jpeg");
      const { token } = StorageService.createUploadToken(storageKey, "user-1", "image/jpeg", 300);

      // Tamper with the token
      const tampered = token.slice(0, -4) + "XXXX";
      assert.throws(
        () => StorageService.verifyUploadToken(tampered),
        /INVALID_SIGNATURE|INVALID_TOKEN/
      );
    });

    it("should generate and verify signed read URLs with expiration", () => {
      const storageKey = "evidence/2026/10/photo.jpg";
      const signedUrl = StorageService.getSignedReadUrl(storageKey, 60);

      assert.ok(signedUrl.includes("/api/media/view"));
      assert.ok(signedUrl.includes("sig="));
      assert.ok(signedUrl.includes("exp="));

      const parsedUrl = new URL(signedUrl, "http://localhost:3000");
      const key = parsedUrl.searchParams.get("key")!;
      const exp = parsedUrl.searchParams.get("exp")!;
      const sig = parsedUrl.searchParams.get("sig")!;

      assert.equal(StorageService.verifyReadSignature(key, exp, sig), true);
      assert.equal(StorageService.verifyReadSignature(key, exp, "fake-sig"), false);
    });
  });

  describe("Location Privacy (Spec Section 18)", () => {
    it("should generate approximate coordinates for citizen public display", () => {
      const exactLat = 8.980612;
      const exactLng = 38.757845;

      const publicCoord = MapService.toPublicCoordinate(exactLat, exactLng, "rep-uuid-1");

      assert.equal(publicCoord.isApproximate, true);
      // Coordinates should be close (within 0.005 degrees ~ 500 meters)
      const distanceKm = NearbyIssuesService.calculateDistanceKm(
        exactLat,
        exactLng,
        publicCoord.latitude,
        publicCoord.longitude
      );
      assert.ok(distanceKm < 0.3, `Distance ${distanceKm}km should be under 300 meters`);
      // But not identical to the 6th decimal place
      assert.notEqual(publicCoord.latitude, exactLat);
      assert.notEqual(publicCoord.longitude, exactLng);
    });

    it("should generate deterministic public coordinates for the same report", () => {
      const coord1 = MapService.toPublicCoordinate(9.012345, 38.745678, "same-report-id");
      const coord2 = MapService.toPublicCoordinate(9.012345, 38.745678, "same-report-id");

      assert.equal(coord1.latitude, coord2.latitude);
      assert.equal(coord1.longitude, coord2.longitude);
    });
  });

  describe("Map Clustering Engine (Spec Sections 39 & 40)", () => {
    it("should cluster proximate points into a cluster with centroid and counts", () => {
      const now = new Date();
      const points: MapPoint[] = [
        // 3 points close to Meskel Square (~200m apart)
        {
          id: "p1",
          publicReference: "CHI-2026-000001",
          title: "Pothole on Meskel Road",
          latitude: 9.0108,
          longitude: 38.7616,
          severity: "CRITICAL",
          status: "IN_PROGRESS",
          category: { id: "c1", name: "Roads", slug: "roads", icon: "🛣️" },
          confirmationCount: 5,
          upvoteCount: 10,
          createdAt: now,
        },
        {
          id: "p2",
          publicReference: "CHI-2026-000002",
          title: "Broken curb nearby",
          latitude: 9.0112,
          longitude: 38.7620,
          severity: "HIGH",
          status: "VERIFIED",
          category: { id: "c1", name: "Roads", slug: "roads", icon: "🛣️" },
          confirmationCount: 2,
          upvoteCount: 4,
          createdAt: now,
        },
        {
          id: "p3",
          publicReference: "CHI-2026-000003",
          title: "Traffic light damaged",
          latitude: 9.0105,
          longitude: 38.7614,
          severity: "MEDIUM",
          status: "ASSIGNED",
          category: { id: "c2", name: "Streetlights", slug: "streetlights", icon: "💡" },
          confirmationCount: 1,
          upvoteCount: 2,
          createdAt: now,
        },
        // 1 distant point in Ayat (~10km away)
        {
          id: "p4",
          publicReference: "CHI-2026-000004",
          title: "Water leak in Ayat",
          latitude: 9.0205,
          longitude: 38.8450,
          severity: "LOW",
          status: "SUBMITTED",
          category: { id: "c3", name: "Water", slug: "water", icon: "💧" },
          confirmationCount: 0,
          upvoteCount: 0,
          createdAt: now,
        },
      ];

      const result = MapService.clusterPoints(points, 0.8);

      assert.equal(result.totalPoints, 4);
      assert.equal(result.clusters.length, 1);
      assert.equal(result.singletons.length, 1);

      const cluster = result.clusters[0]!;
      assert.equal(cluster.count, 3);
      assert.equal(cluster.criticalCount, 1);
      assert.equal(cluster.highCount, 1);
      assert.equal(cluster.dominantCategory, "Roads");

      // Singleton should be Ayat
      assert.equal(result.singletons[0]?.publicReference, "CHI-2026-000004");
    });
  });

  describe("Geocoding & Reverse Geocoding (Spec Section 39)", () => {
    it("should geocode recognized Addis Ababa landmarks", async () => {
      const resBole = await MapService.geocode("Bole Medhanialem");
      assert.ok(resBole.length > 0);
      assert.equal(resBole[0]?.administrativeArea, "Bole Sub-City");
      assert.ok(resBole[0]!.confidence >= 0.8);

      const resPiazza = await MapService.geocode("Piazza");
      assert.ok(resPiazza.length > 0);
      assert.equal(resPiazza[0]?.administrativeArea, "Arada Sub-City");
    });

    it("should reverse geocode coordinates to nearest subcity", async () => {
      // Near Meskel Square
      const reverse = await MapService.reverseGeocode(9.0108, 38.7616);
      assert.equal(reverse.administrativeArea, "Kirkos Sub-City");
      assert.ok(reverse.formattedAddress.includes("Meskel Square"));
    });

    it("should provide resilient fallback points with valid Addis Ababa coordinates", () => {
      const fallbacks = MapService.getFallbackPoints();
      assert.ok(fallbacks.length >= 6);

      for (const p of fallbacks) {
        assert.ok(p.latitude >= 8.8 && p.latitude <= 9.2, `Latitude ${p.latitude} out of Addis range`);
        assert.ok(p.longitude >= 38.6 && p.longitude <= 38.9, `Longitude ${p.longitude} out of Addis range`);
        assert.ok(p.publicReference.startsWith("CHI-"));
        assert.ok(p.title.length > 0);
        assert.ok(p.category.name.length > 0);
      }
    });
  });
});
