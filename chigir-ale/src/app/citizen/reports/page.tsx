import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, SeverityBadge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "My Reports — Chigir Ale",
  description: "View and track all infrastructure reports submitted by you",
};

export default async function MyReportsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/sign-in?callbackUrl=/citizen/reports");
  }

  const reports = await prisma.report.findMany({
    where: { reporterId: session.user.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      category: {
        select: { name: true, icon: true },
      },
    },
  });

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              My Reports / የእኔ ሪፖርቶች
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Track real-time progress and resolutions for your submitted incidents.
            </p>
          </div>
          <Link
            href="/citizen/report/new"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors cursor-pointer shadow-sm"
          >
            + Report New Problem
          </Link>
        </div>

        {reports.length === 0 ? (
          <Card className="text-center py-12 border-dashed">
            <CardContent className="space-y-4">
              <span className="text-4xl block" aria-hidden="true">
                📋
              </span>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  No reports submitted yet
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  When you report road damage, water leaks, or streetlight outages, they will appear here.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/citizen/report/new"
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors"
                >
                  Submit Your First Report
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {reports.map((report) => (
              <Link
                key={report.id}
                href={`/reports/${report.publicReference}`}
                className="group block"
              >
                <Card className="hover:border-emerald-500/60 dark:hover:border-emerald-500/60 transition-all hover:shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {report.publicReference}
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <span>{report.category.icon ?? "📁"}</span>
                            <span>{report.category.name}</span>
                          </span>
                        </div>
                        <h4 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                          {report.title}
                        </h4>
                        {report.formattedAddress && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <span>📍</span>
                            <span>{report.formattedAddress}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                        <SeverityBadge severity={report.severity} />
                        <StatusBadge status={report.status} />
                        <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform text-sm">
                          →
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
