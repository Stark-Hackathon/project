"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, SeverityBadge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import {
  confirmReportAction,
  getNearbyIssuesAction,
} from "@/features/community/actions";
import type { NearbyReportItem } from "@/server/services/nearby-issues.service";

interface NearbyIssuesViewProps {
  initialIssues: NearbyReportItem[];
  defaultLat?: number;
  defaultLng?: number;
}

export function NearbyIssuesView({
  initialIssues,
  defaultLat = 9.0249, // Addis Ababa default coordinates
  defaultLng = 38.7468,
}: NearbyIssuesViewProps) {
  const [issues, setIssues] = useState<NearbyReportItem[]>(initialIssues);
  const [radiusKm, setRadiusKm] = useState(5);
  const [currentCoords, setCurrentCoords] = useState({ lat: defaultLat, lng: defaultLng });
  const [confirmedReports, setConfirmedReports] = useState<Set<string>>(new Set());
  const [isLocating, setIsLocating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const handleRefresh = (lat: number, lng: number, rad: number) => {
    startTransition(async () => {
      const res = await getNearbyIssuesAction(lat, lng, rad);
      if (res.success) {
        setIssues(res.data);
      }
    });
  };

  const handleGpsScan = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setCurrentCoords({ lat, lng });
        handleRefresh(lat, lng, radiusKm);
      },
      () => {
        setIsLocating(false);
      }
    );
  };

  const handleConfirm = (reportId: string) => {
    startTransition(async () => {
      const res = await confirmReportAction(reportId);
      if (res.success) {
        setConfirmedReports((prev) => new Set(prev).add(reportId));
        setIssues((prev) =>
          prev.map((item) =>
            item.id === reportId
              ? { ...item, confirmationCount: res.data.count }
              : item
          )
        );
        setMessage("Thank you! Your confirmation increases incident priority for dispatch.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Controls & Filter Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            isLoading={isLocating || isPending}
            onClick={handleGpsScan}
            className="cursor-pointer"
          >
            📍 Scan My Current Area
          </Button>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Radius:</span>
            <select
              value={radiusKm}
              onChange={(e) => {
                const newRad = Number(e.target.value);
                setRadiusKm(newRad);
                handleRefresh(currentCoords.lat, currentCoords.lng, newRad);
              }}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200"
            >
              <option value={1}>1 km</option>
              <option value={3}>3 km</option>
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={20}>20 km</option>
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-500">
          Found <strong>{issues.length}</strong> active issues nearby
        </span>
      </div>

      {message && (
        <Alert variant="success">{message}</Alert>
      )}

      {/* List of Nearby Issues */}
      {issues.length === 0 ? (
        <Card className="text-center py-12 border-dashed">
          <CardContent className="space-y-3">
            <span className="text-3xl block" aria-hidden="true">
              ✨
            </span>
            <h4 className="text-base font-semibold text-slate-900 dark:text-white">
              No active incidents within {radiusKm}km
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No issues have been reported in this immediate radius. If you spot a problem, be the first to report it!
            </p>
            <div className="pt-2">
              <Link
                href="/citizen/report/new"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
              >
                + Report an Issue
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {issues.map((item) => {
            const isConfirmed = confirmedReports.has(item.id);

            return (
              <Card
                key={item.id}
                className="hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {item.publicReference}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          <span>{item.category.icon ?? "📁"}</span>
                          <span>{item.category.name}</span>
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          📍 {item.distanceKm} km away
                        </span>
                      </div>

                      <h4 className="text-base font-semibold text-slate-900 dark:text-white leading-snug">
                        {item.title}
                      </h4>

                      {item.formattedAddress && (
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <span>🏢</span>
                          <span>{item.formattedAddress}</span>
                        </p>
                      )}

                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 pt-1 leading-relaxed">
                        {item.description}
                      </p>

                      <div className="flex items-center gap-3 pt-2 text-xs text-slate-400">
                        <span>✋ {item.confirmationCount} confirmed</span>
                        <span>▲ {item.upvoteCount} upvotes</span>
                        <span>
                          Reported{" "}
                          {new Date(item.reportedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 pt-2 sm:pt-0">
                      <div className="flex items-center gap-2">
                        <SeverityBadge severity={item.severity} />
                        <StatusBadge status={item.status} />
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          type="button"
                          variant={isConfirmed ? "secondary" : "outline"}
                          size="sm"
                          disabled={isConfirmed || isPending}
                          onClick={() => handleConfirm(item.id)}
                          className="cursor-pointer text-xs"
                        >
                          {isConfirmed ? "✓ Confirmed" : "✋ Experiencing too"}
                        </Button>

                        <Link
                          href={`/reports/${item.publicReference}`}
                          className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium transition-colors"
                        >
                          View →
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
