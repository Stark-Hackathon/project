import { Metadata } from "next";
import { requireAuthorityUser } from "@/lib/auth/session";
import { AnalyticsService } from "@/server/services/analytics.service";
import { HotspotService } from "@/server/services/hotspot.service";
import { OperationalAnalyticsView } from "@/features/analytics/components/operational-analytics-view";

export const metadata: Metadata = {
  title: "Operational Analytics — Authority Portal",
  description: "Workload distribution, SLA velocity, failure hotspots, and resolution analytics.",
};

export default async function AuthorityAnalyticsPage() {
  await requireAuthorityUser();

  const [analytics, hotspots] = await Promise.all([
    AnalyticsService.getOperationalAnalytics({ days: 30 }),
    HotspotService.detectHotspots({ days: 30, minCount: 2 }),
  ]);

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6">
      <OperationalAnalyticsView
        initialAnalytics={analytics}
        initialHotspots={hotspots}
      />
    </main>
  );
}
