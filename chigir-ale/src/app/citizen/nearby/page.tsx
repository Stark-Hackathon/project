import React from "react";
import { Metadata } from "next";
import { NearbyIssuesService } from "@/server/services/nearby-issues.service";
import { NearbyIssuesView } from "@/features/community/components/nearby-issues-view";

export const metadata: Metadata = {
  title: "Nearby Issues — Chigr Ale",
  description: "Explore community infrastructure reports around your location to prevent duplicates",
};

export default async function NearbyIssuesPage() {
  // Default to Addis Ababa central coordinates for initial SSR render
  const defaultLat = 9.0249;
  const defaultLng = 38.7468;

  const initialIssues = await NearbyIssuesService.findNearbyReports(
    defaultLat,
    defaultLng,
    5
  );

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Nearby Community Issues / በአቅራቢያዎ ያሉ ችግሮች
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            See infrastructure problems reported near you. Instead of creating a duplicate report, confirm existing issues with &quot;I&apos;m experiencing this too&quot;.
          </p>
        </div>

        <NearbyIssuesView
          initialIssues={initialIssues}
          defaultLat={defaultLat}
          defaultLng={defaultLng}
        />
      </div>
    </main>
  );
}
