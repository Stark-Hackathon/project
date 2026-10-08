"use client";

import React, { useState, useEffect, useRef, useTransition, useMemo, useCallback } from "react";
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
} from "lucide-react";
import type { Severity, ReportStatus } from "@prisma/client";
import { getMapDataAction, geocodeAddressAction } from "@/features/maps/actions";
import type { MapPoint, MapCluster } from "@/server/services/map.service";

interface InfrastructureMapProps {
  mode: "citizen" | "authority";
  initialCategories?: Array<{ id: string; name: string; slug: string; icon: string | null }>;
  initialDepartments?: Array<{ id: string; name: string; slug: string }>;
}

// Center of Addis Ababa (Meskel Square)
const ADDIS_CENTER = { lat: 9.0108, lng: 38.7616 };

// Notable Addis Ababa Sub-cities & Landmarks with true coordinates for the vector engine
const ADDIS_DISTRICTS = [
  { name: "Piazza / Arada", lat: 9.0345, lng: 38.7525, type: "district" },
  { name: "Merkato", lat: 9.0321, lng: 38.7354, type: "district" },
  { name: "Bole Medhanialem", lat: 8.9984, lng: 38.7865, type: "district" },
  { name: "Meskel Square", lat: 9.0108, lng: 38.7616, type: "landmark" },
  { name: "Megenagna / Yeka", lat: 9.0201, lng: 38.8021, type: "district" },
  { name: "Kazanchis", lat: 9.0189, lng: 38.7699, type: "district" },
  { name: "Mexico Square", lat: 9.0121, lng: 38.7454, type: "landmark" },
  { name: "Gotera Interchange", lat: 8.9867, lng: 38.7543, type: "landmark" },
  { name: "4 Kilo (Arat Kilo)", lat: 9.0348, lng: 38.7628, type: "landmark" },
  { name: "6 Kilo (Sidist Kilo)", lat: 9.0475, lng: 38.7621, type: "landmark" },
  { name: "Sarbet / AU", lat: 8.9954, lng: 38.7323, type: "district" },
  { name: "Bole Airport", lat: 8.9779, lng: 38.7993, type: "landmark" },
  { name: "Ayat / CMC", lat: 9.0205, lng: 38.845, type: "district" },
];

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

  // Map Navigation State
  const [centerLat, setCenterLat] = useState(ADDIS_CENTER.lat);
  const [centerLng, setCenterLng] = useState(ADDIS_CENTER.lng);
  const [zoom, setZoom] = useState(13); // Zoom levels 11 to 17

  // Data state
  const [clusters, setClusters] = useState<MapCluster[]>([]);
  const [singletons, setSingletons] = useState<MapPoint[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<MapCluster | null>(null);

  // Drag-to-pan state
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; lat: number; lng: number } | null>(null);

  // Status notice
  const [geoNotice, setGeoNotice] = useState<{
    type: "info" | "success" | "error";
    message: string;
  } | null>(null);

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

  // Coordinate Projection Helper for Addis Ababa [0, 800] x [0, 520]
  const project = useMemo(() => {
    const zoomScale = Math.pow(1.6, zoom - 13);
    const spanLat = 0.14 / zoomScale;
    const spanLng = 0.22 / zoomScale;

    const minLat = centerLat - spanLat / 2;
    const maxLat = centerLat + spanLat / 2;
    const minLng = centerLng - spanLng / 2;
    const maxLng = centerLng + spanLng / 2;

    return (lat: number, lng: number) => {
      const x = ((lng - minLng) / (maxLng - minLng)) * 800;
      const y = (1 - (lat - minLat) / (maxLat - minLat)) * 520;
      const visible = x >= -40 && x <= 840 && y >= -40 && y <= 560;
      return { x, y, visible };
    };
  }, [centerLat, centerLng, zoom]);

  // Mouse Drag to Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag on left mouse click
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      lat: centerLat,
      lng: centerLng,
    };
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !dragStartRef.current) return;

      const zoomScale = Math.pow(1.6, zoom - 13);
      const spanLat = 0.14 / zoomScale;
      const spanLng = 0.22 / zoomScale;

      const dx = e.clientX - dragStartRef.current.clientX;
      const dy = e.clientY - dragStartRef.current.clientY;

      const deltaLng = (dx / 800) * spanLng;
      const deltaLat = (dy / 520) * spanLat;

      setCenterLng(dragStartRef.current.lng - deltaLng);
      setCenterLat(dragStartRef.current.lat + deltaLat);
    },
    [isDragging, zoom]
  );

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  // Wheel to Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((z) => Math.min(17, z + 1));
    } else if (e.deltaY > 0) {
      setZoom((z) => Math.max(11, z - 1));
    }
  };

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

  // User Location
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
      message: "Detecting your GPS location...",
    });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenterLat(pos.coords.latitude);
        setCenterLng(pos.coords.longitude);
        setZoom(16);
        setGeoNotice({
          type: "success",
          message: `Location locked (±${Math.round(pos.coords.accuracy)}m accuracy)`,
        });
      },
      (err) => {
        let msg = "Could not obtain GPS. Showing Addis Ababa central view.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Location permission denied. Showing default Addis Ababa view.";
        }
        setCenterLat(ADDIS_CENTER.lat);
        setCenterLng(ADDIS_CENTER.lng);
        setZoom(13);
        setGeoNotice({
          type: "info",
          message: msg,
        });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
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
                placeholder="Search location (e.g. Bole, Piazza, Meskel Square, Megenagna, Merkato)..."
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

      {/* Notice Banner */}
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
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={`relative bg-[#0b111e] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden h-[540px] w-full select-none ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] z-30 flex items-center justify-center">
            <span className="text-xs text-white bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-700 animate-pulse">
              Updating map data…
            </span>
          </div>
        )}

        {/* Zoom & Reset Controls */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 bg-slate-900/90 border border-slate-800 p-1.5 rounded-xl shadow-md backdrop-blur-md">
          <button
            type="button"
            title="Zoom In"
            onClick={() => setZoom((z) => Math.min(17, z + 1))}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Zoom Out"
            onClick={() => setZoom((z) => Math.max(11, z - 1))}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Reset View to Addis Ababa Center"
            onClick={() => {
              setCenterLat(ADDIS_CENTER.lat);
              setCenterLng(ADDIS_CENTER.lng);
              setZoom(13);
            }}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3.5 py-2 rounded-xl text-[11px] text-slate-300 flex items-center gap-3 shadow-md">
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

        {/* Map Engine Indicator */}
        <div className="absolute bottom-4 right-4 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-2.5 py-1 rounded-lg text-[10px] text-emerald-400 flex items-center gap-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Addis Ababa Civic Grid (Active)</span>
        </div>

        {/* Interactive Vector Cartography of Addis Ababa */}
        <svg
          viewBox="0 0 800 520"
          className="w-full h-full pointer-events-none"
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="streetGrid" width="36" height="36" patternUnits="userSpaceOnUse">
              <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#162032" strokeWidth="0.6" />
            </pattern>
            {/* Radial Critical Halo */}
            <radialGradient id="criticalHalo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background landmass & street grid */}
          <rect width="800" height="520" fill="#0b111e" />
          <rect width="800" height="520" fill="url(#streetGrid)" opacity="0.8" />

          {/* Entoto Forest Reserve in North Addis */}
          {(() => {
            const p1 = project(9.07, 38.71);
            const p2 = project(9.085, 38.77);
            const p3 = project(9.06, 38.81);
            const p4 = project(9.045, 38.74);
            return (
              <polygon
                points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`}
                fill="#064e3b"
                opacity="0.25"
              />
            );
          })()}

          {/* Major Real Addis Arterials */}
          {/* 1. Ring Road (Elliptical Expressway) */}
          {(() => {
            const rN = project(9.05, 38.76);
            const rE = project(9.01, 38.83);
            const rS = project(8.96, 38.76);
            const rW = project(9.01, 38.70);
            return (
              <path
                d={`M ${rW.x} ${rW.y} Q ${rW.x} ${rN.y} ${rN.x} ${rN.y} Q ${rE.x} ${rN.y} ${rE.x} ${rE.y} Q ${rE.x} ${rS.y} ${rS.x} ${rS.y} Q ${rW.x} ${rS.y} ${rW.x} ${rW.y}`}
                fill="none"
                stroke="#1e293b"
                strokeWidth="4"
                strokeDasharray="6 3"
                opacity="0.8"
              />
            );
          })()}

          {/* 2. Bole Road / Africa Ave (Meskel Square -> Bole Medhanialem -> Airport) */}
          {(() => {
            const meskel = project(9.0108, 38.7616);
            const olympia = project(8.9892, 38.758);
            const medhanialem = project(8.9984, 38.7865);
            const airport = project(8.9779, 38.7993);
            return (
              <g stroke="#334155" strokeWidth="3" fill="none" opacity="0.9">
                <path d={`M ${meskel.x} ${meskel.y} L ${olympia.x} ${olympia.y} L ${medhanialem.x} ${medhanialem.y} L ${airport.x} ${airport.y}`} />
              </g>
            );
          })()}

          {/* 3. Churchill Road & Piazza to Legehar */}
          {(() => {
            const piazza = project(9.0345, 38.7525);
            const legehar = project(9.015, 38.752);
            const meskel = project(9.0108, 38.7616);
            return (
              <path
                d={`M ${piazza.x} ${piazza.y} L ${legehar.x} ${legehar.y} L ${meskel.x} ${meskel.y}`}
                stroke="#334155"
                strokeWidth="2.5"
                fill="none"
                opacity="0.9"
              />
            );
          })()}

          {/* 4. Menelik II Ave / Haile Gebreselassie Ave (Meskel Square -> Kazanchis -> Megenagna) */}
          {(() => {
            const meskel = project(9.0108, 38.7616);
            const kazanchis = project(9.0189, 38.7699);
            const megenagna = project(9.0201, 38.8021);
            const ayat = project(9.0205, 38.845);
            return (
              <path
                d={`M ${meskel.x} ${meskel.y} L ${kazanchis.x} ${kazanchis.y} L ${megenagna.x} ${megenagna.y} L ${ayat.x} ${ayat.y}`}
                stroke="#334155"
                strokeWidth="3"
                fill="none"
                opacity="0.9"
              />
            );
          })()}

          {/* 5. Mexico Square -> Merkato / Tor Hailoch */}
          {(() => {
            const meskel = project(9.0108, 38.7616);
            const mexico = project(9.0121, 38.7454);
            const merkato = project(9.0321, 38.7354);
            return (
              <path
                d={`M ${meskel.x} ${meskel.y} L ${mexico.x} ${mexico.y} L ${merkato.x} ${merkato.y}`}
                stroke="#334155"
                strokeWidth="2.5"
                fill="none"
                opacity="0.9"
              />
            );
          })()}

          {/* Landmark Labels & Sub-city Indicators */}
          {ADDIS_DISTRICTS.map((loc) => {
            const p = project(loc.lat, loc.lng);
            if (!p.visible) return null;

            return (
              <g key={loc.name} transform={`translate(${p.x}, ${p.y})`}>
                <circle
                  r={loc.type === "landmark" ? "3" : "2"}
                  fill={loc.type === "landmark" ? "#10b981" : "#64748b"}
                  opacity="0.8"
                />
                <text
                  dy="-6"
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize={loc.type === "landmark" ? "9" : "8"}
                  fontWeight="600"
                  fontFamily="sans-serif"
                  letterSpacing="0.02em"
                  className="select-none"
                >
                  {loc.name}
                </text>
              </g>
            );
          })}

          {/* Render Clusters */}
          {clusters.map((cluster) => {
            const pos = project(cluster.centerLatitude, cluster.centerLongitude);
            if (!pos.visible) return null;

            const isCritical = cluster.criticalCount > 0;
            const size = Math.min(36, Math.max(24, 20 + cluster.count * 2));

            return (
              <g
                key={cluster.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPoint(null);
                  setSelectedCluster(cluster);
                  setCenterLat(cluster.centerLatitude);
                  setCenterLng(cluster.centerLongitude);
                  setZoom((z) => Math.min(16, z + 2));
                }}
                className="cursor-pointer pointer-events-auto group"
              >
                {/* Glow ring */}
                <circle
                  r={size + 6}
                  fill={isCritical ? "url(#criticalHalo)" : "#4f46e5"}
                  opacity={isCritical ? 1 : 0.25}
                  className="group-hover:opacity-60 transition-opacity"
                />
                {/* Main bubble */}
                <circle
                  r={size}
                  fill={isCritical ? "#ef4444" : "#4f46e5"}
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  className="shadow-lg group-hover:scale-110 transition-transform"
                />
                {/* Count text */}
                <text
                  textAnchor="middle"
                  dy=".35em"
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="800"
                  pointerEvents="none"
                >
                  {cluster.count}
                </text>
              </g>
            );
          })}

          {/* Render Singletons (Incident Pins) */}
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
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCluster(null);
                  setSelectedPoint(point);
                }}
                className="cursor-pointer pointer-events-auto group"
              >
                {/* Pulsing ring for critical */}
                {point.severity === "CRITICAL" && (
                  <circle
                    r="16"
                    fill="url(#criticalHalo)"
                    className="animate-ping"
                    style={{ animationDuration: "1.8s" }}
                  />
                )}
                {/* Pin Shadow */}
                <ellipse cx="0" cy="4" rx="5" ry="2" fill="#000000" opacity="0.4" />
                {/* Outer halo */}
                <circle
                  r="10"
                  fill={color}
                  opacity="0.3"
                  className="group-hover:opacity-60 transition-opacity"
                />
                {/* Center marker */}
                <circle
                  r="6.5"
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="group-hover:scale-125 transition-transform shadow-md"
                />
              </g>
            );
          })}
        </svg>

        {/* Selected Point Popover */}
        {selectedPoint && (
          <div className="absolute top-4 left-4 z-40 max-w-sm w-[calc(100%-2rem)] sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xl space-y-3 animate-in fade-in slide-in-from-top-2 pointer-events-auto">
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
                className="font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 cursor-pointer"
              >
                View details <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        {/* Selected Cluster Info Box */}
        {selectedCluster && (
          <div className="absolute top-4 left-4 z-40 max-w-sm w-[calc(100%-2rem)] sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xl space-y-3 animate-in fade-in pointer-events-auto">
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
                    className="font-medium text-slate-900 dark:text-white hover:text-emerald-600 truncate flex-1 cursor-pointer"
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
