import { Metadata } from "next";
import { AnalyticsService } from "@/server/services/analytics.service";
import { HotspotService } from "@/server/services/hotspot.service";
import { TransparencyDashboard } from "@/features/analytics/components/transparency-dashboard";

export const metadata: Metadata = {
  title: "Public Infrastructure Transparency — Chigr Ale",
  description: "Addis Ababa municipal civic performance, resolution metrics, and hotspot analysis.",
};

export default async function TransparencyPage() {
  const [metrics, hotspots] = await Promise.all([
    AnalyticsService.getPublicTransparencyMetrics(),
    HotspotService.detectHotspots({ days: 30, minCount: 2 }),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <TransparencyDashboard
        initialMetrics={metrics}
        initialHotspots={hotspots}
      />
    </main>
  );
}
