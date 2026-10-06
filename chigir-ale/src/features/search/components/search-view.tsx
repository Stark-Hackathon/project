"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  MapPin,
  ArrowRight,
  Layers,
  Building,
  RotateCcw,
} from "lucide-react";
import type { SearchResultItem } from "@/server/services/search.service";
import type { Severity, ReportStatus } from "@prisma/client";
import { searchReportsAction } from "@/features/search/actions";

interface SearchViewProps {
  initialResults: SearchResultItem[];
  initialTotalCount: number;
  initialQuery?: string;
  categories: Array<{ id: string; name: string; slug: string }>;
  isAuthenticated: boolean;
}

export function SearchView({
  initialResults,
  initialTotalCount,
  initialQuery = "",
  categories,
  isAuthenticated,
}: SearchViewProps) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | "ALL">("ALL");
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | "ALL">("ALL");
  const [selectedSubcity, setSelectedSubcity] = useState("ALL");
  const [scopeToSelf, setScopeToSelf] = useState(false);

  const [results, setResults] = useState<SearchResultItem[]>(initialResults);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(initialResults.length < initialTotalCount);
  const [isPending, startTransition] = useTransition();

  const PAGE_SIZE = 12;

  const executeSearch = (currentPage = 0) => {
    startTransition(async () => {
      const res = await searchReportsAction({
        query: query.trim() || undefined,
        categoryId: selectedCategory !== "ALL" ? selectedCategory : undefined,
        severity: selectedSeverity !== "ALL" ? selectedSeverity : undefined,
        status: selectedStatus !== "ALL" ? selectedStatus : undefined,
        subcity: selectedSubcity !== "ALL" ? selectedSubcity : undefined,
        scopeToSelf,
        limit: PAGE_SIZE,
        offset: currentPage * PAGE_SIZE,
      });

      if (res.success) {
        setResults(res.data.items);
        setTotalCount(res.data.totalCount);
        setHasMore(res.data.hasMore);
        setPage(currentPage);
      }
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(0);
  };

  const handleReset = () => {
    setQuery("");
    setSelectedCategory("ALL");
    setSelectedSeverity("ALL");
    setSelectedStatus("ALL");
    setSelectedSubcity("ALL");
    setScopeToSelf(false);
    startTransition(async () => {
      const res = await searchReportsAction({
        limit: PAGE_SIZE,
        offset: 0,
      });
      if (res.success) {
        setResults(res.data.items);
        setTotalCount(res.data.totalCount);
        setHasMore(res.data.hasMore);
        setPage(0);
      }
    });
  };

  const SUBCITIES = [
    "Bole",
    "Kirkos",
    "Yeka",
    "Arada",
    "Lideta",
    "Kolfe Keranio",
    "Gullele",
    "Nifas Silk",
    "Akaky Kaliti",
    "Addis Ketema",
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Search Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Civic Infrastructure Search (Spec §97)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Search issues across Addis Ababa by public reference (#CHI-YYYY-NNNNNN), keyword, category, or subcity.
          </p>
        </div>

        {/* Search input bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reference #CHI-2026-..., keywords (e.g. water leak, pothole, blackout)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm"
          >
            {isPending ? "Searching…" : "Search"}
          </button>
        </form>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </span>

          {/* Scope Tab */}
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => {
                setScopeToSelf(!scopeToSelf);
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
                scopeToSelf
                  ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {scopeToSelf ? "✓ My Reports Only" : "My Reports"}
            </button>
          )}

          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Subcity */}
          <select
            value={selectedSubcity}
            onChange={(e) => setSelectedSubcity(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="ALL">All Subcities</option>
            {SUBCITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Severity */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value as Severity | "ALL")}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as ReportStatus | "ALL")}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="VERIFIED">Verified</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <button
            type="button"
            onClick={handleReset}
            title="Reset Filters"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Found <strong>{totalCount}</strong> matching incidents
        </span>
        {totalCount > PAGE_SIZE && (
          <span>
            Page {page + 1} of {Math.ceil(totalCount / PAGE_SIZE)}
          </span>
        )}
      </div>

      {/* Results Grid */}
      {results.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No incidents matched your query
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search terms, removing filters, or searching by exact reference number (#CHI-YYYY-NNNNNN).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((r) => {
            const severityColor =
              r.severity === "CRITICAL"
                ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                : r.severity === "HIGH"
                ? "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300"
                : r.severity === "MEDIUM"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";

            return (
              <div
                key={r.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      #{r.publicReference}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${severityColor}`}>
                      {r.severity}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                    {r.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                    {r.description}
                  </p>

                  <div className="mt-3 space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{r.categoryName}</span>
                    </div>

                    {r.administrativeArea && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-500" />
                        <span>{r.administrativeArea}</span>
                      </div>
                    )}

                    {r.departmentName && (
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-purple-500" />
                        <span>{r.departmentName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-semibold px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {r.status}
                  </span>

                  <Link
                    href={`/reports/${r.publicReference}`}
                    className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    View Details <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalCount > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            type="button"
            disabled={page === 0 || isPending}
            onClick={() => executeSearch(page - 1)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40"
          >
            ← Previous
          </button>
          <span className="text-xs text-slate-400">
            Page {page + 1} of {Math.ceil(totalCount / PAGE_SIZE)}
          </span>
          <button
            type="button"
            disabled={!hasMore || isPending}
            onClick={() => executeSearch(page + 1)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
