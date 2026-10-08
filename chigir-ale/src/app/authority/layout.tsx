import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  LayoutDashboard,
  FileText,
  MapPin,
  Shield,
  ArrowLeft,
  LogOut,
  Building2,
  Bell,
  BarChart3,
} from "lucide-react";
import { signOutAction } from "@/features/auth/actions";
import { prisma } from "@/lib/db/prisma";

export default async function AuthorityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/sign-in?callbackUrl=/authority");
  }

  // Check if user has an authority membership
  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      status: "ACTIVE",
      role: { in: ["STAFF", "FIELD_WORKER", "DEPARTMENT_MANAGER", "ORG_ADMIN", "PLATFORM_ADMIN"] },
    },
    include: {
      organization: true,
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row">
      {/* Sidebar Navigation (Spec Section 28) */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
        <div className="p-6 border-b border-slate-800/80">
          <Link href="/authority" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-bold">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-white tracking-tight block text-base leading-none">
                Chigr Ale
              </span>
              <span className="text-[10px] text-emerald-400 font-mono tracking-wider uppercase font-semibold">
                Authority Portal
              </span>
            </div>
          </Link>

          {membership?.organization && (
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-400">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="truncate font-medium">{membership.organization.name}</span>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1.5 text-xs font-semibold">
          <Link
            href="/authority"
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <LayoutDashboard className="w-4 h-4 text-emerald-400" />
            Dashboard Overview
          </Link>

          <Link
            href="/authority/reports"
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            Reports Management
          </Link>

          <Link
            href="/authority/map"
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <MapPin className="w-4 h-4 text-amber-400" />
            Live Map &amp; Incidents
          </Link>

          <Link
            href="/authority/analytics"
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-purple-400" />
            Operational Analytics
          </Link>

          <Link
            href="/notifications"
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <Bell className="w-4 h-4 text-rose-400" />
            Notifications
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-800/60 text-xs">
            <span className="block text-[11px] text-slate-400">Signed in as</span>
            <span className="font-semibold text-white block truncate">
              {session.user.name || session.user.email}
            </span>
            <span className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
              {membership?.role ?? "STAFF"}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs px-2 pt-1">
            <Link
              href="/"
              className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Public View
            </Link>

            <form action={signOutAction}>
              <button
                type="submit"
                className="text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
