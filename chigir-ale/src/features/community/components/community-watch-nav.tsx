"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, Map, User } from "lucide-react";

interface CommunityWatchNavProps {
  activeTab?: "home" | "report" | "map" | "profile";
  onTabChange?: (tab: "home" | "report" | "map" | "profile") => void;
}

export function CommunityWatchNav({ activeTab, onTabChange }: CommunityWatchNavProps) {
  const pathname = usePathname();

  const currentTab = activeTab || (
    pathname === "/" || pathname === "/home" ? "home" :
    pathname.includes("/report") ? "report" :
    pathname.includes("/map") || pathname.includes("/nearby") ? "map" :
    pathname.includes("/profile") ? "profile" : "home"
  );

  const navItems = [
    { key: "home" as const, label: "Home", href: "/", icon: Home },
    { key: "report" as const, label: "Report", href: "/citizen/report/new", icon: PlusCircle, isPrimary: true },
    { key: "map" as const, label: "Map", href: "/map", icon: Map },
    { key: "profile" as const, label: "Profile", href: "/citizen/profile", icon: User },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] w-full"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {navItems.map((item) => {
          const isActive = currentTab === item.key;
          const Icon = item.icon;

          if (onTabChange) {
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onTabChange(item.key)}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
                  isActive
                    ? "text-emerald-700 dark:text-emerald-400 font-semibold"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${isActive ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
                <span className="text-[11px] leading-tight tracking-tight">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                isActive
                  ? "text-emerald-700 dark:text-emerald-400 font-semibold"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
              <span className="text-[11px] leading-tight tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
