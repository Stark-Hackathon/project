"use client";

import React, { useState, useEffect, useRef, useTransition, useCallback } from "react";
import Link from "next/link";
import {
  MapPin,
  Layers,
  Search,
  Shield,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Navigation,
  Building,
  Filter,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Globe,
} from "lucide-react";
import type { Severity, ReportStatus } from "@prisma/client";
import type * as Leaflet from "leaflet";
import { getMapDataAction, geocodeAddressAction } from "@/features/maps/actions";
import type { MapPoint, MapCluster } from "@/server/services/map.service";

interface InfrastructureMapProps {
  mode: "citizen" | "authority";
  initialCategories?: Array<{ id: string; name: string; slug: string; icon: string | null }>;
  initialDepartments?: Array<{ id: string; name: string; slug: string }>;
}

const ADDIS_ABABA_CENTER = { lat: 9.0108, lng: 38.7616 };
const DEFAULT_ZOOM = 13;

export function InfrastructureMap({
  mode,
  initialCategories = [],
  initialDepartments = [],
}: InfrastructureMapProps) {
  const isAuthority = mode === "authority";
  const [, startTransition] = useTransition();

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | "ALL">("ALL");
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | "ALL">("ALL");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Map DOM and instance references
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<Leaflet.Map | null>(null);
  const markersGroupRef = useRef<Leaflet.LayerGroup | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);

  // Map state
  const [clusters, setClusters] = useState<MapCluster[]>([]);
  const [singletons, setSingletons] = useState<MapPoint[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<MapCluster | null>(null);
  const [tileProviderName, setTileProviderName] = useState<string>("OpenStreetMap / CartoDB");
  const [geoNotice, setGeoNotice] = useState<{
    type: "info" | "success" | "error";
    message: string;
  } | null>(null);

  // Clear notice after 5 seconds
  useEffect(() => {
    if (!geoNotice) return;
    const t = setTimeout(() => setGeoNotice(null), 5000);
    return () => clearTimeout(t);
  }, [geoNotice]);

  // Load Map Data
  useEffect(() => {
    let ignore = false;

    getMapDataAction({
      mode,
      categoryId: selectedCategory !== "ALL" ? selectedCategory : undefined,
      severity: selectedSeverity,
      status: selectedStatus,
      departmentId: selectedDepartment !== "ALL" ? selectedDepartment : undefined,
    }).then((result) => {
      if (!ignore) {
        if (result.success) {
          setClusters(result.data.clusters);
          setSingletons(result.data.singletons);
          setTotalPoints(result.data.totalPoints);
        }
        setIsLoading(false);
      }
    });

    return () => {
      ignore = true;
    };
  }, [mode, selectedCategory, selectedSeverity, selectedStatus, selectedDepartment]);

  // Initialize Leaflet Map (Browser-only, SSR-safe)
  useEffect(() => {
    let isCancelled = false;

    async function initLeaflet() {
      if (typeof window === "undefined" || !mapContainerRef.current) return;

      // Dynamically import Leaflet only in browser to avoid SSR `window is not defined`
      const leafletModule = await import("leaflet");
      const L = leafletModule.default;
      if (isCancelled) return;
      leafletRef.current = L;

      // Clean up previous instance if container was reused
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Ensure container has no remaining leaflet internal state
      const container = mapContainerRef.current as HTMLDivElement & { _leaflet_id?: number };
      if (container._leaflet_id) {
        delete container._leaflet_id;
      }

      // Initialize map instance centered on Addis Ababa
      const map = L.map(container, {
        center: [ADDIS_ABABA_CENTER.lat, ADDIS_ABABA_CENTER.lng],
        zoom: DEFAULT_ZOOM,
        zoomControl: false,
        attributionControl: false,
        maxZoom: 18,
        minZoom: 10,
      });

      mapInstanceRef.current = map;

      // Configure Tile Layer Strategy:
      // Priority 1: Mapbox IF NEXT_PUBLIC_MAPBOX_TOKEN is provided
      // Priority 2: CartoDB Voyager tiles (crisp, modern civic street details, zero API key)
      // Fallback: Standard OpenStreetMap tiles
      const mapboxToken =
        process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAP_API_KEY;

      let primaryTileUrl =
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
      let primarySubdomains = "abcd";

      if (mapboxToken && mapboxToken !== "placeholder-map-api-key") {
        primaryTileUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`;
        primarySubdomains = "abc";
        setTileProviderName("Mapbox Streets");
      } else {
        setTileProviderName("OpenStreetMap / CartoDB");
      }

      const primaryLayer = L.tileLayer(primaryTileUrl, {
        subdomains: primarySubdomains,
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors, CartoDB",
      });

      // Attach tile error listener to gracefully switch to OpenStreetMap if primary fails
      primaryLayer.on("tileerror", () => {
        if (!isCancelled && mapInstanceRef.current) {
          console.warn("Primary tile provider failed, falling back to OpenStreetMap tiles.");
          setTileProviderName("OpenStreetMap (Standard)");
          const osmFallback = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "© OpenStreetMap contributors",
          });
          osmFallback.addTo(mapInstanceRef.current);
        }
      });

      primaryLayer.addTo(map);

      // Create a layer group to hold markers and clusters
      const markersGroup = L.layerGroup();
      markersGroup.addTo(map);
      markersGroupRef.current = markersGroup;

      // Trigger size invalidation after mount to ensure accurate tile dimensions
      setTimeout(() => {
        if (!isCancelled && mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 150);

      setMapLoaded(true);
    }

    initLeaflet();

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markersGroupRef.current = null;
      setMapLoaded(false);
    };
  }, []);

  // Update Markers when clusters, singletons, or mapLoaded change
  const updateMarkers = useCallback(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    const L = leafletRef.current;

    if (!map || !markersGroup || !L) return;

    // Clear previous markers
    markersGroup.clearLayers();

    // 1. Render Clusters
    clusters.forEach((cluster) => {
      const isCritical = cluster.criticalCount > 0;
      const size = Math.min(42, Math.max(26, 22 + cluster.count * 2));
      const bgColor = isCritical ? "#ef4444" : "#4f46e5";
      const ringColor = isCritical ? "rgba(239, 68, 68, 0.35)" : "rgba(79, 70, 229, 0.35)";

      const clusterHtml = `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background-color: ${bgColor};
          border: 2.5px solid #ffffff;
          border-radius: 9999px;
          box-shadow: 0 4px 14px ${ringColor};
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-weight: 800;
          font-size: 11px;
          cursor: pointer;
          transition: transform 0.15s ease-out;
        " class="hover:scale-110">
          ${cluster.count}
        </div>
      `;

      const clusterIcon = L.divIcon({
        html: clusterHtml,
        className: "custom-cluster-icon",
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([cluster.centerLatitude, cluster.centerLongitude], {
        icon: clusterIcon,
        title: `${cluster.count} incidents clustered`,
      });

      marker.on("click", () => {
        setSelectedPoint(null);
        setSelectedCluster(cluster);
        map.setView(
          [cluster.centerLatitude, cluster.centerLongitude],
          Math.min(17, map.getZoom() + 2),
          { animate: true }
        );
      });

      markersGroup.addLayer(marker);
    });

    // 2. Render Singletons (Individual incident pins)
    singletons.forEach((point) => {
      const color =
        point.severity === "CRITICAL"
          ? "#ef4444"
          : point.severity === "HIGH"
          ? "#f97316"
          : point.severity === "MEDIUM"
          ? "#f59e0b"
          : "#3b82f6";

      const pinHtml = `
        <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <div style="
            width: 14px;
            height: 14px;
            background-color: ${color};
            border: 2px solid #ffffff;
            border-radius: 9999px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          "></div>
          ${
            point.severity === "CRITICAL"
              ? `<div style="
                  position: absolute;
                  inset: 2px;
                  border-radius: 9999px;
                  border: 2px solid ${color};
                  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                "></div>`
              : ""
          }
        </div>
      `;

      const pinIcon = L.divIcon({
        html: pinHtml,
        className: "custom-point-pin",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([point.latitude, point.longitude], {
        icon: pinIcon,
        title: point.title,
      });

      // Leaflet Popup binding
      const popupHtml = `
        <div style="padding: 12px; font-family: inherit; font-size: 12px; max-width: 260px;">
          <div style="font-size: 10px; font-weight: 700; color: #64748b; font-family: monospace;">
            ${point.publicReference}
          </div>
          <div style="font-weight: 700; color: #0f172a; font-size: 13px; margin-top: 2px; line-height: 1.3;">
            ${point.title}
          </div>
          <div style="display: flex; gap: 4px; margin-top: 6px; flex-wrap: wrap;">
            <span style="background: ${color}20; color: ${color}; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 10px;">
              ${point.severity}
            </span>
            <span style="background: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px; font-size: 10px;">
              ${point.category.icon ? point.category.icon + " " : ""}${point.category.name}
            </span>
          </div>
          <div style="color: #64748b; font-size: 11px; margin-top: 6px;">
            📍 ${point.formattedAddress || point.administrativeArea || "Addis Ababa"}
          </div>
          <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #f1f5f9; text-align: right;">
            <a href="${
              isAuthority
                ? `/authority/reports/${point.publicReference}`
                : `/reports/${point.publicReference}`
            }" style="color: #059669; font-weight: 700; text-decoration: none;">
              Inspect issue →
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: "chigr-map-popup",
        closeButton: true,
      });

      marker.on("click", () => {
        setSelectedCluster(null);
        setSelectedPoint(point);
      });

      markersGroup.addLayer(marker);
    });
  }, [clusters, singletons, isAuthority]);

  useEffect(() => {
    if (mapLoaded) {
      updateMarkers();
    }
  }, [mapLoaded, updateMarkers]);

  // Geocoding Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    startTransition(async () => {
      const res = await geocodeAddressAction(searchQuery.trim());
      if (res.success && res.data.length > 0) {
        const first = res.data[0]!;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([first.latitude, first.longitude], 15, {
            duration: 1.2,
          });
        }
        setGeoNotice({
          type: "success",
          message: `Moved to ${first.formattedAddress}`,
        });
      } else {
        setGeoNotice({
          type: "info",
          message: "Location not found in local catalog. Centered on Addis Ababa.",
        });
      }
    });
  };

  // Safe Geolocation with robust fallback and error handling
  const handleLocateMe = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGeoNotice({
        type: "error",
        message: "Geolocation is not supported by your current browser.",
      });
      return;
    }

    setGeoNotice({
      type: "info",
      message: "Requesting location coordinates...",
    });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 1.2 });
        }
        setGeoNotice({
          type: "success",
          message: `Location detected (±${Math.round(pos.coords.accuracy)}m accuracy)`,
        });
      },
      (err) => {
        let msg = "Could not obtain location. Centered on Addis Ababa.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Location permission denied. Showing default Addis Ababa view.";
        } else if (err.code === err.TIMEOUT) {
          msg = "Location request timed out. Showing default Addis Ababa view.";
        }

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([ADDIS_ABABA_CENTER.lat, ADDIS_ABABA_CENTER.lng], 13);
        }
        setGeoNotice({
          type: "info",
          message: msg,
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Map Navigation Controls
  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([ADDIS_ABABA_CENTER.lat, ADDIS_ABABA_CENTER.lng], DEFAULT_ZOOM);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner / Mode Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isAuthority
                ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
            }`}
          >
            {isAuthority ? <Building className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {isAuthority ? "Operational Infrastructure Grid" : "Community Issues & Map"}
              </h2>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  isAuthority
                    ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                }`}
              >
                {isAuthority ? "Dispatch Mode" : "Privacy Shield Active"}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAuthority
                ? "Exact GPS operational dispatch coordinates with density clustering."
                : "Public view with approximate neighborhood coordinates to protect resident privacy (Spec §18)."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs shrink-0">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {totalPoints} incidents mapped
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="text-slate-500 dark:text-slate-400">
            {clusters.length} clusters, {singletons.length} solo pins
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Geocoding Search */}
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search location (e.g. Bole, Piazza, Meskel Square, Megenagna)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity cursor-pointer shrink-0"
            >
              Pan
            </button>
          </form>

          {/* Quick Find Me */}
          <button
            type="button"
            onClick={handleLocateMe}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Navigation className="w-3.5 h-3.5 text-blue-500" /> Locate Me
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-400 flex items-center gap-1 font-semibold mr-1">
            <Filter className="w-3 h-3" /> Filters:
          </span>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
          >
            <option value="ALL">All Categories</option>
            {initialCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Severity Filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value as Severity | "ALL")}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>

          {/* Department Filter (Authority mode) */}
          {isAuthority && initialDepartments.length > 0 && (
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
            >
              <option value="ALL">All Departments</option>
              {initialDepartments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as ReportStatus | "ALL")}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="VERIFIED">Verified</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Notice Banner (Geolocation status / geocoding alert) */}
      {geoNotice && (
        <div
          className={`flex items-center gap-2 p-3 rounded-xl text-xs transition animate-in fade-in ${
            geoNotice.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800"
              : geoNotice.type === "error"
              ? "bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800"
              : "bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800"
          }`}
        >
          {geoNotice.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{geoNotice.message}</span>
        </div>
      )}

      {/* Interactive Map Canvas Container */}
      <div className="relative bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden h-[540px] w-full">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] z-30 flex items-center justify-center">
            <span className="text-xs text-white bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-700 animate-pulse">
              Updating map data…
            </span>
          </div>
        )}

        {/* Real Leaflet Map DOM Element */}
        <div
          ref={mapContainerRef}
          className="w-full h-full min-h-[500px] z-0"
          tabIndex={0}
          aria-label="Interactive city infrastructure map"
        />

        {/* Zoom & Reset Controls */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 p-1.5 rounded-xl shadow-md backdrop-blur-md">
          <button
            type="button"
            title="Zoom In"
            onClick={handleZoomIn}
            className="p-1.5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Zoom Out"
            onClick={handleZoomOut}
            className="p-1.5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Reset View to Addis Ababa Center"
            onClick={handleResetView}
            className="p-1.5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-3 shadow-md">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/30" />
            <span>Critical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span>High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            <span>Low</span>
          </div>
        </div>

        {/* Tile Provider Pill */}
        <div className="absolute bottom-4 right-4 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-lg text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 shadow-sm">
          <Globe className="w-3 h-3 text-slate-400" />
          <span>{tileProviderName}</span>
        </div>

        {/* Selected Point Popover */}
        {selectedPoint && (
          <div className="absolute top-4 left-4 z-40 max-w-sm w-[calc(100%-2rem)] sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xl space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-slate-500">
                  {selectedPoint.publicReference}
                </span>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                  {selectedPoint.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPoint(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span
                className={`px-2 py-0.5 rounded-full font-semibold ${
                  selectedPoint.severity === "CRITICAL"
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                    : selectedPoint.severity === "HIGH"
                    ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                    : selectedPoint.severity === "MEDIUM"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                }`}
              >
                {selectedPoint.severity}
              </span>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                {selectedPoint.status.replace("_", " ")}
              </span>
              <span className="text-slate-500">
                {selectedPoint.category.icon ? selectedPoint.category.icon + " " : ""}
                {selectedPoint.category.name}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span className="truncate">
                {selectedPoint.formattedAddress || selectedPoint.administrativeArea || "Addis Ababa"}
              </span>
            </p>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                {selectedPoint.confirmationCount} confirmations • {selectedPoint.upvoteCount} upvotes
              </span>
              <Link
                href={
                  isAuthority
                    ? `/authority/reports/${selectedPoint.publicReference}`
                    : `/reports/${selectedPoint.publicReference}`
                }
                className="font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
              >
                View details <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        {/* Selected Cluster Info Box */}
        {selectedCluster && (
          <div className="absolute top-4 left-4 z-40 max-w-sm w-[calc(100%-2rem)] sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xl space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Incident Cluster ({selectedCluster.count} issues)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCluster(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Predominant category: <strong>{selectedCluster.dominantCategory}</strong>
              {selectedCluster.criticalCount > 0 && (
                <span className="text-rose-600 font-bold block mt-0.5">
                  ⚠️ Contains {selectedCluster.criticalCount} Critical incident(s)
                </span>
              )}
            </p>

            <div className="max-h-40 overflow-y-auto space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {selectedCluster.points.map((p) => (
                <div key={p.id} className="pt-1.5 flex items-center justify-between">
                  <span className="font-mono text-slate-500 truncate mr-2">{p.publicReference}</span>
                  <Link
                    href={
                      isAuthority
                        ? `/authority/reports/${p.publicReference}`
                        : `/reports/${p.publicReference}`
                    }
                    className="font-medium text-slate-900 dark:text-white hover:text-emerald-600 truncate flex-1"
                  >
                    {p.title}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
