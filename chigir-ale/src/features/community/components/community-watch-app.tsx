"use client";

import React, { useState } from "react";
import {
  Mic,
  MapPin,
  Flame,
  User,
  Shield,
  Layers,
  FileText,
  Sparkles,
} from "lucide-react";

import { ScreenWelcome } from "./screen-welcome";
import { ScreenHomeMap } from "./screen-home-map";
import { ScreenReportIssue } from "./screen-report-issue";
import { ScreenReportDetails } from "./screen-report-details";
import { ScreenNearbyIssues } from "./screen-nearby-issues";
import { ScreenTrendingIssues } from "./screen-trending-issues";
import { ScreenProfileSettings } from "./screen-profile-settings";
import { ScreenImpact } from "./screen-impact";
import { CommunityWatchNav } from "./community-watch-nav";

export type ScreenId =
  | "welcome"
  | "home-map"
  | "report-voice"
  | "report-details"
  | "nearby"
  | "trending"
  | "profile"
  | "impact";

export function CommunityWatchApp() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>("home-map");

  // Active report state for details screen
  const [activeReport, setActiveReport] = useState<{
    id: string;
    title: string;
    category: string;
    location: string;
    description: string;
    reportedVia: "voice" | "photo" | "text";
    reportsCount: number;
    timeAgo: string;
  }>({
    id: "CHI-2026-000001",
    title: "Road damage",
    category: "Infrastructure",
    location: "Near Bole Road, Addis Ababa",
    description:
      "Large pothole in the right lane causing traffic slowdown and potential tire damage. Deep enough to damage wheel rims.",
    reportedVia: "voice",
    reportsCount: 3,
    timeAgo: "2 hours ago",
  });

  const screensMeta: { id: ScreenId; label: string; number: number; icon: React.ElementType }[] = [
    { id: "welcome", label: "Welcome", number: 1, icon: Sparkles },
    { id: "home-map", label: "Map & Clusters", number: 2, icon: MapPin },
    { id: "report-voice", label: "Voice Report", number: 3, icon: Mic },
    { id: "report-details", label: "Incident Details", number: 4, icon: FileText },
    { id: "nearby", label: "Nearby Feed", number: 5, icon: Layers },
    { id: "trending", label: "Trending", number: 6, icon: Flame },
    { id: "profile", label: "Profile", number: 7, icon: User },
    { id: "impact", label: "Mission & Impact", number: 8, icon: Shield },
  ];

  const handleIssueSelect = (issueId: string) => {
    if (issueId === "CHI-2026-000004") {
      setActiveReport({
        id: "CHI-2026-000004",
        title: "Garbage overflow",
        category: "Sanitation",
        location: "Olympia Roundabout, Bole",
        description:
          "Municipal dumpsters are overflowing onto the pedestrian sidewalk, attracting stray animals and blocking the walkway.",
        reportedVia: "photo",
        reportsCount: 8,
        timeAgo: "4 hours ago",
      });
    } else if (issueId === "CHI-2026-000012") {
      setActiveReport({
        id: "CHI-2026-000012",
        title: "Water pipe leakage",
        category: "Utilities",
        location: "Africa Ave opposite Edna Mall",
        description:
          "High-pressure clean water pipe ruptured under the pavement, flooding 50 meters of the roadway.",
        reportedVia: "voice",
        reportsCount: 19,
        timeAgo: "2 days ago",
      });
    } else {
      setActiveReport({
        id: "CHI-2026-000001",
        title: "Road damage",
        category: "Infrastructure",
        location: "Near Bole Road, Addis Ababa",
        description:
          "Large pothole in the right lane causing traffic slowdown and potential tire damage. Deep enough to damage wheel rims.",
        reportedVia: "voice",
        reportsCount: 3,
        timeAgo: "2 hours ago",
      });
    }
    setCurrentScreen("report-details");
  };

  const handleReportSubmitted = (data: {
    title: string;
    description: string;
    category: string;
    location: string;
    method: "voice" | "photo" | "text";
  }) => {
    setActiveReport({
      id: `CHI-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      title: data.title,
      category: data.category.charAt(0).toUpperCase() + data.category.slice(1),
      location: data.location,
      description: data.description,
      reportedVia: data.method,
      reportsCount: 1,
      timeAgo: "Just now",
    });
    setCurrentScreen("report-details");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation Bar: Responsive for Desktop, Laptop, and Tablet */}
      <header className="sticky top-0 z-40 w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Brand Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0e3e2c] flex items-center justify-center text-emerald-400 font-black shadow-md border border-emerald-600/30 flex-shrink-0">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                    Chigr Ale
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-wide">
                    STARK 2026
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Civic Infrastructure Reporting & Vixovide Voice
                </p>
              </div>
            </div>

            {/* Mobile Voice CTA Button */}
            <div className="md:hidden">
              <button
                onClick={() => setCurrentScreen("report-voice")}
                className="px-3 py-1.5 rounded-xl bg-[#0e3e2c] text-emerald-300 border border-emerald-600/50 hover:bg-[#15533c] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                <span>Voice</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs Bar for Desktop/Laptop/Tablet */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {screensMeta.map((s) => {
              const isActive = currentScreen === s.id;
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setCurrentScreen(s.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                      : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-slate-950" : "text-slate-400"}`} />
                  <span>{s.label}</span>
                </button>
              );
            })}

            {/* Quick Action Button */}
            <button
              onClick={() => setCurrentScreen("report-voice")}
              className="hidden lg:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0e3e2c] text-emerald-300 border border-emerald-600/50 hover:bg-[#15533c] text-xs font-bold transition cursor-pointer shadow-sm ml-2"
            >
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              <span>Record Voice</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Responsive Web Application Canvas (Desktop, Laptop, Tablet, Mobile) */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-8">
        {/* Screen 1: Welcome */}
        {currentScreen === "welcome" && (
          <ScreenWelcome
            onGetStarted={() => setCurrentScreen("home-map")}
            onSignIn={() => setCurrentScreen("home-map")}
          />
        )}

        {/* Screen 2: Home Map */}
        {currentScreen === "home-map" && (
          <ScreenHomeMap
            onSelectIssue={handleIssueSelect}
            onOpenReport={() => setCurrentScreen("report-voice")}
            onOpenTrending={() => setCurrentScreen("trending")}
            onOpenProfile={() => setCurrentScreen("profile")}
            onOpenNearby={() => setCurrentScreen("nearby")}
          />
        )}

        {/* Screen 3: Report an Issue (Voice Focus) */}
        {currentScreen === "report-voice" && (
          <ScreenReportIssue
            onBack={() => setCurrentScreen("home-map")}
            onSubmitSuccess={handleReportSubmitted}
          />
        )}

        {/* Screen 4: Report Details */}
        {currentScreen === "report-details" && (
          <ScreenReportDetails
            reportId={activeReport.id}
            title={activeReport.title}
            category={activeReport.category}
            location={activeReport.location}
            description={activeReport.description}
            reportedVia={activeReport.reportedVia}
            reportsCount={activeReport.reportsCount}
            timeAgo={activeReport.timeAgo}
            onBack={() => setCurrentScreen("home-map")}
            onViewOnMap={() => setCurrentScreen("home-map")}
            onNavigateHome={() => setCurrentScreen("home-map")}
            onNavigateReport={() => setCurrentScreen("report-voice")}
            onNavigateProfile={() => setCurrentScreen("profile")}
          />
        )}

        {/* Screen 5: Nearby Issues */}
        {currentScreen === "nearby" && (
          <ScreenNearbyIssues
            onBack={() => setCurrentScreen("home-map")}
            onSelectIssue={handleIssueSelect}
          />
        )}

        {/* Screen 6: Trending Issues */}
        {currentScreen === "trending" && (
          <ScreenTrendingIssues
            onBack={() => setCurrentScreen("home-map")}
            onSelectIssue={handleIssueSelect}
            onNavigateHome={() => setCurrentScreen("home-map")}
            onNavigateReport={() => setCurrentScreen("report-voice")}
            onNavigateMap={() => setCurrentScreen("home-map")}
            onNavigateProfile={() => setCurrentScreen("profile")}
          />
        )}

        {/* Screen 7: Profile & Settings */}
        {currentScreen === "profile" && (
          <ScreenProfileSettings
            onBack={() => setCurrentScreen("home-map")}
            onNavigateHome={() => setCurrentScreen("home-map")}
            onNavigateReport={() => setCurrentScreen("report-voice")}
            onNavigateMap={() => setCurrentScreen("home-map")}
            onNavigateNearby={() => setCurrentScreen("nearby")}
            onNavigateImpact={() => setCurrentScreen("impact")}
          />
        )}

        {/* Screen 8: Impact & Mission */}
        {currentScreen === "impact" && (
          <ScreenImpact
            onBack={() => setCurrentScreen("profile")}
            onStartReporting={() => setCurrentScreen("report-voice")}
            onExploreMap={() => setCurrentScreen("home-map")}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation (only visible on mobile devices) */}
      <CommunityWatchNav
        activeTab={
          currentScreen === "home-map" || currentScreen === "welcome"
            ? "home"
            : currentScreen === "report-voice"
            ? "report"
            : currentScreen === "profile" || currentScreen === "impact"
            ? "profile"
            : "map"
        }
        onTabChange={(tab) => {
          if (tab === "home") setCurrentScreen("home-map");
          if (tab === "report") setCurrentScreen("report-voice");
          if (tab === "map") setCurrentScreen("nearby");
          if (tab === "profile") setCurrentScreen("profile");
        }}
      />

      {/* Responsive Footer with System Status */}
      <footer className="w-full border-t border-slate-800 bg-slate-900/50 py-6 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-300">Vixovide Voice Engine:</span>
            <span className="text-emerald-400 font-mono">Active (Web Audio + Speech API + /api/ai/transcribe)</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>STARK Hackathon Civic Tech</span>
            <span>•</span>
            <span>Addis Ababa Infrastructure Watch</span>
            <span>•</span>
            <button
              onClick={() => setCurrentScreen("impact")}
              className="hover:text-emerald-400 transition cursor-pointer"
            >
              Impact Mission
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
