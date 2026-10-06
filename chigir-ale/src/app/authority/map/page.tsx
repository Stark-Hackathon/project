import React from "react";
import type { Metadata } from "next";
import { CategoryRepository } from "@/server/repositories/category.repository";
import { AuthorityRepository } from "@/server/repositories/authority.repository";
import { InfrastructureMap } from "@/features/maps/components/infrastructure-map";

export const metadata: Metadata = {
  title: "Operational Dispatch Map — Authority Portal",
  description: "Exact coordinates, incident clusters, and department coverage for municipal dispatch.",
};

export default async function AuthorityMapPage() {
  const [categories, departments] = await Promise.all([
    CategoryRepository.listActive(),
    AuthorityRepository.listDepartments(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Operational Dispatch Map
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Exact operational GPS coordinates, high-density incident clusters, and department coverage for field dispatch.
        </p>
      </div>

      <InfrastructureMap
        mode="authority"
        initialCategories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          icon: c.icon,
        }))}
        initialDepartments={departments.map((d) => ({
          id: d.id,
          name: d.name,
          slug: d.slug,
        }))}
      />
    </div>
  );
}
