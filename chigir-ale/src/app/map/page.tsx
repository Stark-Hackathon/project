import React from "react";
import type { Metadata } from "next";
import { MapHeader } from "./map-header";
import { CategoryRepository } from "@/server/repositories/category.repository";
import { InfrastructureMap } from "@/features/maps/components/infrastructure-map";

export const metadata: Metadata = {
  title: "City Infrastructure Map — Chigr Ale",
  description: "Explore neighborhood infrastructure reports, ongoing repairs, and community issues across Addis Ababa.",
};

export default async function PublicMapPage() {
  let categories: Array<{ id: string; name: string; slug: string; icon: string | null }> = [];
  try {
    const dbCats = await CategoryRepository.listActive();
    categories = dbCats.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      icon: c.icon,
    }));
  } catch (err) {
    console.warn("PublicMapPage: using fallback categories due to DB error:", err);
    categories = [
      { id: "water", name: "Water Outage", slug: "water", icon: "💧" },
      { id: "electricity", name: "Electricity", slug: "electricity", icon: "⚡" },
      { id: "roads", name: "Roads & Potholes", slug: "roads", icon: "🛣️" },
      { id: "waste", name: "Waste Management", slug: "waste", icon: "🗑️" },
      { id: "traffic", name: "Traffic Signals", slug: "traffic", icon: "🚦" },
      { id: "network", name: "Telecom / Network", slug: "network", icon: "🌐" },
    ];
  }

  return (
    <main className="min-h-screen bg-[#fafcfb] dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Bilingual Header Strip */}
        <MapHeader />

        {/* Existing Working Map Component */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <InfrastructureMap
            mode="citizen"
            initialCategories={categories}
          />
        </div>
      </div>
    </main>
  );
}
