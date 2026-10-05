"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  colorToken: string | null;
  children?: CategoryItem[];
}

interface CategorySelectorProps {
  categories: CategoryItem[];
  selectedCategoryId: string;
  onSelect: (categoryId: string) => void;
}

export function CategorySelector({
  categories,
  selectedCategoryId,
  onSelect,
}: CategorySelectorProps) {
  // If categories are empty (e.g. before seed), provide fallback list
  const displayCategories =
    categories.length > 0
      ? categories
      : [
          {
            id: "cat-infra",
            name: "Infrastructure",
            slug: "infrastructure",
            description: "Physical public infrastructure",
            icon: "🏗️",
            colorToken: "amber",
            children: [
              { id: "cat-roads", name: "Roads & Potholes", slug: "roads", description: "Potholes, cracks, and blockages", icon: "🛣️", colorToken: "amber" },
              { id: "cat-drainage", name: "Drainage & Flooding", slug: "drainage", description: "Clogged drains and runoff", icon: "🌊", colorToken: "blue" },
              { id: "cat-streetlights", name: "Streetlights", slug: "streetlights", description: "Broken or non-functioning lighting", icon: "💡", colorToken: "yellow" },
              { id: "cat-traffic", name: "Traffic Signals", slug: "traffic-infrastructure", description: "Traffic lights and signage", icon: "🚦", colorToken: "red" },
            ],
          },
          {
            id: "cat-util",
            name: "Utilities",
            slug: "utilities",
            description: "Essential public utility services",
            icon: "⚡",
            colorToken: "blue",
            children: [
              { id: "cat-water", name: "Water Supply", slug: "water", description: "Pipe leaks, outages, or contaminated water", icon: "💧", colorToken: "blue" },
              { id: "cat-power", name: "Electricity", slug: "electricity", description: "Power cuts, downed lines, sparks", icon: "⚡", colorToken: "yellow" },
              { id: "cat-telecom", name: "Network & Telecom", slug: "telecommunications", description: "Cables and telecom disruptions", icon: "📡", colorToken: "purple" },
            ],
          },
          {
            id: "cat-public",
            name: "Public Services",
            slug: "public-services",
            description: "Sanitation and community sanitation",
            icon: "🏪",
            colorToken: "green",
            children: [
              { id: "cat-waste", name: "Waste Management", slug: "waste-management", description: "Illegal dumping or overflowing bins", icon: "🗑️", colorToken: "green" },
              { id: "cat-sanitation", name: "Sanitation & Sewer", slug: "sanitation", description: "Sewage leaks and public health risks", icon: "🚿", colorToken: "teal" },
              { id: "cat-other", name: "Other Community Issues", slug: "other-community", description: "Other shared neighborhood hazards", icon: "🏘️", colorToken: "gray" },
            ],
          },
        ];

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-base font-semibold text-slate-900 dark:text-white">
          What type of problem are you reporting?
        </h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Select the category that best matches what you see.
        </p>
      </div>

      <div className="space-y-6">
        {displayCategories.map((group) => (
          <div key={group.id} className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-lg" aria-hidden="true">
                {group.icon ?? "📁"}
              </span>
              <h5 className="font-semibold text-slate-800 dark:text-slate-200 text-sm tracking-wide">
                {group.name}
              </h5>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(group.children && group.children.length > 0
                ? group.children
                : [group]
              ).map((sub) => {
                const isSelected = selectedCategoryId === sub.id;

                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => onSelect(sub.id)}
                    className={cn(
                      "flex items-start gap-3.5 p-4 rounded-xl border text-left transition-all cursor-pointer select-none",
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 ring-2 ring-emerald-500 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    )}
                    aria-pressed={isSelected}
                  >
                    <span className="text-2xl shrink-0 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800" aria-hidden="true">
                      {sub.icon ?? "⚠️"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 dark:text-white text-sm">
                          {sub.name}
                        </span>
                        {isSelected && (
                          <span className="h-2 w-2 rounded-full bg-emerald-600 ring-4 ring-emerald-200 dark:ring-emerald-900" />
                        )}
                      </div>
                      {sub.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {sub.description}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
