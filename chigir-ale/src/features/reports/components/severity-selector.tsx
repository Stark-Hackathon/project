"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";

export type SeverityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

interface SeverityOption {
  level: SeverityLevel;
  title: string;
  badge: string;
  description: string;
  colorBorder: string;
  colorBg: string;
  colorRing: string;
}

const SEVERITY_OPTIONS: SeverityOption[] = [
  {
    level: "LOW",
    title: "Low / ዝቅተኛ",
    badge: "🟢 Low Impact",
    description: "Minor inconvenience. Does not prevent normal movement or pose direct hazard.",
    colorBorder: "border-slate-300 dark:border-slate-700",
    colorBg: "bg-slate-50/60 dark:bg-slate-800/40",
    colorRing: "ring-emerald-500",
  },
  {
    level: "MEDIUM",
    title: "Medium / መካከለኛ",
    badge: "🟡 Normal Urgency",
    description: "Standard public disruption (e.g. broken streetlight, normal water leakage). Needs attention.",
    colorBorder: "border-amber-300 dark:border-amber-700",
    colorBg: "bg-amber-50/50 dark:bg-amber-950/20",
    colorRing: "ring-amber-500",
  },
  {
    level: "HIGH",
    title: "High / ከፍተኛ",
    badge: "🟠 High Urgency",
    description: "Major service interruption, main road blockage, or property risk affecting multiple homes.",
    colorBorder: "border-orange-300 dark:border-orange-700",
    colorBg: "bg-orange-50/50 dark:bg-orange-950/20",
    colorRing: "ring-orange-500",
  },
  {
    level: "CRITICAL",
    title: "Critical / አደገኛ",
    badge: "🔴 Critical Danger",
    description: "Immediate safety hazard: exposed live power cable, deep collapse, toxic spill, or severe flood.",
    colorBorder: "border-rose-400 dark:border-rose-700",
    colorBg: "bg-rose-50/60 dark:bg-rose-950/30",
    colorRing: "ring-rose-500",
  },
];

interface SeveritySelectorProps {
  selectedSeverity: SeverityLevel;
  onChange: (severity: SeverityLevel) => void;
}

export function SeveritySelector({
  selectedSeverity,
  onChange,
}: SeveritySelectorProps) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-base font-semibold text-slate-900 dark:text-white">
          How urgent is this problem? / የችግሩ አጣዳፊነት
        </h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Select the level that accurately describes the hazard and impact on the public.
        </p>
      </div>

      <div className="space-y-3">
        {SEVERITY_OPTIONS.map((option) => {
          const isSelected = selectedSeverity === option.level;

          return (
            <button
              key={option.level}
              type="button"
              onClick={() => onChange(option.level)}
              className={cn(
                "w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all cursor-pointer select-none",
                isSelected
                  ? `border-emerald-600 dark:border-emerald-500 ${option.colorBg} ring-2 ${option.colorRing} shadow-sm`
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              )}
              aria-pressed={isSelected}
            >
              <div className="pt-0.5">
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border",
                    isSelected
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-slate-300 dark:border-slate-600"
                  )}
                >
                  {isSelected && <span className="h-2 w-2 rounded-full bg-white" />}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white text-sm">
                    {option.title}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    {option.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  {option.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Warning on Critical Selection per Spec Section 20 */}
      {selectedSeverity === "CRITICAL" && (
        <Alert
          variant="danger"
          title="⚠️ Safety Notice: Emergency Situations"
        >
          Chigir Ale notifies municipal and utility teams for scheduled maintenance and infrastructure repairs. If this situation poses an <strong>immediate threat to life, injury, active fire, or crime</strong>, please contact local emergency authorities (e.g. Police 991, Fire/Rescue 939, Ambulance 907) immediately.
        </Alert>
      )}
    </div>
  );
}
