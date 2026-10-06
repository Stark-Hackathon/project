"use client";

import React, { useState, useEffect, useTransition, useMemo } from "react";
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
} from "lucide-react";
import type { Severity, ReportStatus } from "@prisma/client";
import { getMapDataAction, geocodeAddressAction } from "@/features/maps/actions";
import type { MapPoint, MapCluster } from "@/server/services/map.service";

interface InfrastructureMapProps {
  mode: "citizen" | "authority";
  initialCategories?: Array<{ id: string; name: string; slug: string; icon: string | null }>;
  initialDepartments?: Array<{ id: string; name: string; slug: string }>;
}

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

  // Map viewport (Addis Ababa default center)
  const [centerLat, setCenterLat] = useState(9.0108);
  const [centerLng, setCenterLng] = useState(38.7616);
  const [zoom, setZoom] = useState(13); // Zoom levels 10 to 18

  // Data state
  const [clusters, setClusters] = useState<MapCluster[]>([]);
  const [singletons, setSingletons] = useState<MapPoint[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<MapCluster | null>(null);

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

  // Geocoding Search
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    startTransition(async () => {
      const res = await geocodeAddressAction(searchQuery.trim());
      if (res.success && res.data.length > 0) {
        const first = res.data[0]!;
        setCenterLat(first.latitude);
        setCenterLng(first.longitude);
        setZoom(15);
      }
    });
  };

  // User Location
  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenterLat(pos.coords.latitude);
        setCenterLng(pos.coords.longitude);
        setZoom(15);
      },
      () => {},
      { enableHighAccuracy: true }
    );
  };

  // Coordinate Projection Helper for SVG Canvas
  // Maps geo coordinates into [0, 800] x [0, 500] coordinate space
  const project = useMemo(() => {
    // Zoom factor scales the bounding window
    const spanLat = 0.15 / (zoom / 12);
    const spanLng = 0.22 / (zoom / 12);

    const minLat = centerLat - spanLat / 2;
    const maxLat = centerLat + spanLat / 2;
    const minLng = centerLng - spanLng / 2;
    const maxLng = centerLng + spanLng / 2;

    return (lat: number, lng: number) => {
      const x = ((lng - minLng) / (maxLng - minLng)) * 800;
      const y = (1 - (lat - minLat) / (maxLat - minLat)) * 500;
      return { x, y, visible: x >= -30 && x <= 830 && y >= -30 && y <= 530 };
    };
  }, [centerLat, centerLng, zoom]);

  return (
    <div className="space-y-4">
      {/* Top Banner / Mode Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
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

        <div className="flex items-center gap-3 text-xs">
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
              className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              Pan
            </button>
          </form>

          {/* Quick Find Me */}
          <button
            type="button"
            onClick={handleLocateMe}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
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
            onChange={(e) => {
              setIsLoading(true);
              setSelectedCategory(e.target.value);
            }}
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
            onChange={(e) => {
              setIsLoading(true);
              setSelectedSeverity(e.target.value as Severity | "ALL");
            }}
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
              onChange={(e) => {
                setIsLoading(true);
                setSelectedDepartment(e.target.value);
              }}
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
            onChange={(e) => {
              setIsLoading(true);
              setSelectedStatus(e.target.value as ReportStatus | "ALL");
            }}
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

      {/* Interactive Map Canvas Container */}
      <div className="relative bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden h-[540px]">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] z-30 flex items-center justify-center">
            <span className="text-xs text-white bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-700 animate-pulse">
              Updating map data…
            </span>
          </div>
        )}

        {/* Zoom & Reset Controls */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 bg-slate-900/90 border border-slate-800 p-1.5 rounded-xl shadow-md">
          <button
            type="button"
            title="Zoom In"
            onClick={() => setZoom((z) => Math.min(18, z + 1))}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Zoom Out"
            onClick={() => setZoom((z) => Math.max(10, z - 1))}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Reset View to Addis Ababa Center"
            onClick={() => {
              setCenterLat(9.0108);
              setCenterLng(38.7616);
              setZoom(13);
            }}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-20 bg-slate-900/85 backdrop-blur-md border border-slate-800 px-3.5 py-2.5 rounded-xl text-[11px] text-slate-300 flex items-center gap-3">
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

        {/* SVG Vector Map Rendering */}
        <svg
          viewBox="0 0 800 500"
          className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        >
          {/* Background Map Grid */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
            </pattern>
            {/* Pulsing ring for critical clusters */}
            <radialGradient id="criticalPulse" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="800" height="500" fill="#090d16" />
          <rect width="800" height="500" fill="url(#grid)" />

          {/* Schematic Major Arterial Roads for Addis Ababa Context */}
          <g stroke="#1e293b" strokeWidth="1.5" fill="none" opacity="0.6">
            <path d="M 100 250 Q 400 240 700 260" />
            <path d="M 400 50 Q 390 250 410 450" />
            <path d="M 250 100 Q 400 250 550 400" />
            <path d="M 550 100 Q 400 250 250 400" />
          </g>

          {/* Render Clusters (Spec Sections 39 & 40) */}
          {clusters.map((cluster) => {
            const pos = project(cluster.centerLatitude, cluster.centerLongitude);
            if (!pos.visible) return null;

            const isCritical = cluster.criticalCount > 0;
            const size = Math.min(38, Math.max(22, 18 + cluster.count * 2));

            return (
              <g
                key={cluster.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => {
                  setSelectedPoint(null);
                  setSelectedCluster(cluster);
                  setCenterLat(cluster.centerLatitude);
                  setCenterLng(cluster.centerLongitude);
                  setZoom((z) => Math.min(17, z + 2));
                }}
                className="cursor-pointer group"
              >
                {/* Glow ring */}
                <circle
                  r={size + 6}
                  fill={isCritical ? "url(#criticalPulse)" : "#6366f1"}
                  opacity="0.25"
                  className="group-hover:opacity-50 transition-opacity"
                />
                {/* Main bubble */}
                <circle
                  r={size}
                  fill={isCritical ? "#ef4444" : "#4f46e5"}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="shadow-lg group-hover:scale-110 transition-transform"
                />
                {/* Cluster Count Text */}
                <text
                  textAnchor="middle"
                  dy=".3em"
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  {cluster.count}
                </text>
              </g>
            );
          })}

          {/* Render Singletons (Individual Pins) */}
          {singletons.map((point) => {
            const pos = project(point.latitude, point.longitude);
            if (!pos.visible) return null;

            const color =
              point.severity === "CRITICAL"
                ? "#ef4444"
                : point.severity === "HIGH"
                ? "#f97316"
                : point.severity === "MEDIUM"
                ? "#f59e0b"
                : "#3b82f6";

            return (
              <g
                key={point.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => {
                  setSelectedCluster(null);
                  setSelectedPoint(point);
                }}
                className="cursor-pointer group"
              >
                {/* Pin shadow */}
                <ellipse cx="0" cy="5" rx="5" ry="2" fill="#000000" opacity="0.4" />
                {/* Pin Body */}
                <circle
                  r="7"
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="group-hover:scale-125 transition-transform"
                />
              </g>
            );
          })}
        </svg>

        {/* Selected Point Popover */}
        {selectedPoint && (
          <div className="absolute top-4 left-4 z-40 max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xl space-y-3 animate-in fade-in slide-in-from-top-2">
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
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg leading-none"
              >
                ×
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span
                className={`px-2 py-0.5 rounded-full font-semibold ${
                  selectedPoint.severity === "CRITICAL"
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {selectedPoint.severity}
              </span>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                {selectedPoint.status.replace("_", " ")}
              </span>
              <span className="text-slate-500">
                {selectedPoint.category.icon} {selectedPoint.category.name}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
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
          <div className="absolute top-4 left-4 z-40 max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xl space-y-3 animate-in fade-in">
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
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Predominant category: <strong>{selectedCluster.dominantCategory}</strong>
              {selectedCluster.criticalCount > 0 && (
                <span className="text-rose-600 font-bold block mt-0.5">
                  ⚠️ Contains {selectedCluster.criticalCount} Critical priority incident(s)
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
