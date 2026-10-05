import React from "react";
import type { Metadata } from "next";
import { AuthorityRepository, type AuthorityReportFilters } from "@/server/repositories/authority.repository";
import { CategoryRepository } from "@/server/repositories/category.repository";
import { AuthorityReportsTable } from "@/features/authority/components/authority-reports-table";
import type { ReportStatus, Severity } from "@prisma/client";

export const metadata: Metadata = {
  title: "Reports Management — Authority Portal",
  description: "Search, filter, prioritize, and assign infrastructure reports.",
};

export default async function AuthorityReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    status?: string;
    severity?: string;
    category?: string;
    department?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;

  const filters: AuthorityReportFilters = {
    search: params.search,
    status: (params.status as ReportStatus | "ALL") || "ALL",
    severity: (params.severity as Severity | "ALL") || "ALL",
    categoryId: params.category || "ALL",
    departmentId: params.department || "ALL",
    sortBy: (params.sort as AuthorityReportFilters["sortBy"]) || "priority_desc",
    page: params.page ? parseInt(params.page, 10) : 1,
    pageSize: 15,
  };

  const [reportsResult, categories, departments] = await Promise.all([
    AuthorityRepository.listReports(filters),
    CategoryRepository.listActive(),
    AuthorityRepository.listDepartments(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Reports Management
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review reported issues, filter by operational status, assign to field teams, and track SLA targets.
        </p>
      </div>

      <AuthorityReportsTable
        reports={reportsResult.items}
        pagination={reportsResult.pagination}
        filterOptions={{
          categories: categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
          departments: departments.map((d) => ({ id: d.id, name: d.name, slug: d.slug })),
        }}
      />
    </div>
  );
}
