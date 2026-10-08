"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Share2,
  MapPin,
  Mic,
  Clock,
  CheckCircle2,
  ThumbsUp,
  AlertTriangle,
} from "lucide-react";

interface ScreenReportDetailsProps {
  reportId?: string;
  title?: string;
  category?: string;
  location?: string;
  description?: string;
  reportedVia?: "voice" | "photo" | "text";
  status?: string;
  reportsCount?: number;
  timeAgo?: string;
  imageUrl?: string;
  onBack?: () => void;
  onViewOnMap?: () => void;
  onNavigateHome?: () => void;
  onNavigateReport?: () => void;
  onNavigateProfile?: () => void;
}

export function ScreenReportDetails({
  reportId = "CHI-2026-000001",
  title = "Road damage",
  category = "Infrastructure",
  location = "Near Bole Road, Addis Ababa",
  description = "Large pothole in the right lane causing traffic slowdown and potential tire damage. Deep enough to damage wheel rims.",
  reportedVia = "voice",
  status = "Open",
  reportsCount = 3,
  timeAgo = "2 hours ago",
  imageUrl,
  onBack,
  onViewOnMap,
}: ScreenReportDetailsProps) {
  const [confirmedCount, setConfirmedCount] = useState(reportsCount);
  const [hasConfirmed, setHasConfirmed] = useState(false);

  const handleConfirm = () => {
    if (!hasConfirmed) {
      setConfirmedCount((prev) => prev + 1);
      setHasConfirmed(true);
    } else {
      setConfirmedCount((prev) => prev - 1);
      setHasConfirmed(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              Report Details
            </h1>
            <p className="text-xs sm:text-sm font-mono text-slate-500">
              Reference: {reportId}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: `${title} - Chigr Ale`,
                text: `${title} at ${location}`,
                url: window.location.href,
              }).catch(() => {});
            }
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          aria-label="Share"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* Responsive 2-Column Incident Layout on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Hero Evidence Photo Card (6 cols on desktop) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative w-full h-72 sm:h-96 rounded-3xl overflow-hidden bg-slate-900 shadow-lg border border-slate-200/80 dark:border-slate-800 flex items-center justify-center">
            {imageUrl ? (
              <div
                className="w-full h-full relative bg-cover bg-center"
                style={{ backgroundImage: `url(${imageUrl})` }}
              >
                <div className="absolute inset-0 bg-black/20" />
              </div>
            ) : (
              <div className="w-full h-full relative bg-gradient-to-br from-neutral-800 via-neutral-900 to-stone-900 flex items-center justify-center">
                {/* Asphalt texture simulation */}
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#555_1px,transparent_1px)] [background-size:12px_12px]" />
                {/* Crater shape */}
                <div className="relative w-64 h-36 rounded-[45%_55%_60%_40%/50%_60%_40%_50%] bg-neutral-950 border-4 border-neutral-700/60 shadow-inner flex flex-col items-center justify-center p-4">
                  <div className="w-44 h-20 rounded-[50%] bg-black/95 shadow-2xl" />
                  <div className="absolute top-3 left-8 w-10 h-4 rounded-full bg-stone-600/40" />
                  <div className="absolute bottom-4 right-10 w-16 h-5 rounded-full bg-stone-700/50" />
                </div>
              </div>
            )}

            {/* Photo counter badge "1/2" */}
            <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold tracking-wider">
              1/2 Photos
            </div>

            {/* Severity Chip */}
            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>High Priority Incident</span>
            </div>
          </div>
        </div>

        {/* Right Column: Incident Details, Vixovide Speech Chip, and Confirmation (6 cols on desktop) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            {/* Title & Category Row */}
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {title}
                </h2>
                <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#0e3e2c] text-white">
                  {category}
                </span>
              </div>

              {/* Location Pin */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                <MapPin className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span className="font-semibold">{location}</span>
              </div>
            </div>

            {/* Description Body */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <p>{description}</p>
            </div>

            {/* Reporting Metadata Badges */}
            <div className="flex flex-wrap items-center gap-2">
              {reportedVia === "voice" && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800 text-xs font-bold">
                  <Mic className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Reported via Vixovide Voice</span>
                </div>
              )}

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{timeAgo}</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{status}</span>
              </div>
            </div>

            {/* Community Confirmation Section */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Avatar Stack */}
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    A
                  </div>
                  <div className="w-8 h-8 rounded-full bg-teal-600 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    M
                  </div>
                  <div className="w-8 h-8 rounded-full bg-amber-600 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    D
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {confirmedCount} community members
                  </p>
                  <p className="text-[11px] text-slate-500">have confirmed this disruption</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirm}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  hasConfirmed
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>{hasConfirmed ? "Confirmed ✓" : "+1 Me too"}</span>
              </button>
            </div>

            {/* Primary Action Button: View on Map */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onViewOnMap}
                className="w-full py-4 rounded-2xl bg-[#0e3e2c] hover:bg-[#15533c] text-white font-extrabold text-sm shadow-xl shadow-emerald-950/25 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <MapPin className="w-4 h-4" />
                <span>View on Hyperlocal Map →</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
