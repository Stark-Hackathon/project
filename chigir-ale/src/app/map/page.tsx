import React from "react";
import type { Metadata } from "next";
import { CategoryRepository } from "@/server/repositories/category.repository";
import { InfrastructureMap } from "@/features/maps/components/infrastructure-map";

export const metadata: Metadata = {
  title: "City Infrastructure Map — Chigir Ale",
  description: "Explore neighborhood infrastructure reports, ongoing repairs, and community issues.",
};

export default async function PublicMapPage() {
  const categories = await CategoryRepository.listActive();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          City Infrastructure Map
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Explore infrastructure reports across Addis Ababa. Coordinates are privacy-masked for residential safety.
        </p>
      </div>

      <InfrastructureMap
        mode="citizen"
        initialCategories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          icon: c.icon,
        }))}
      />
    </div>
  );
}
