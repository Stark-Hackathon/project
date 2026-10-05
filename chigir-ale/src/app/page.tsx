import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";

export default function HomePage() {
  const categoryShortcuts = [
    { name: "Water Leaks & Outages", icon: "💧", slug: "water" },
    { name: "Electricity & Power", icon: "⚡", slug: "electricity" },
    { name: "Road Damage & Potholes", icon: "🛣️", slug: "roads" },
    { name: "Broken Streetlights", icon: "💡", slug: "streetlights" },
    { name: "Waste & Sanitation", icon: "🗑️", slug: "waste-management" },
    { name: "Traffic Signals", icon: "🚦", slug: "traffic-infrastructure" },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Main Hero */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex flex-col justify-center">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Civic Infrastructure Reporting Live
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            See a problem? <br className="hidden sm:inline" />
            <span className="text-emerald-600 dark:text-emerald-400">Report it. Track it. Fix it.</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
            Chigir Ale connects residents with responsible municipal authorities by turning real-world infrastructure failures into location-based, evidence-supported, trackable incident reports.
          </p>

          {/* Primary Action Section - Visually Dominant (Spec Section 13.1) */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Link
              href="/citizen/report/new"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <AlertTriangle className="w-5 h-5" />
              Report a Problem Now
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <Link
              href="/citizen/reports"
              className="inline-flex items-center justify-center px-6 py-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-base transition-colors"
            >
              My Reported Issues
            </Link>
          </div>

          {/* Quick Tracking Search */}
          <div className="pt-4 max-w-md">
            <form action="/reports" method="GET" className="space-y-2">
              <label htmlFor="refSearch" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Already have a reference number?
              </label>
              <div className="flex gap-2">
                <input
                  id="refSearch"
                  name="ref"
                  type="text"
                  placeholder="e.g. CHI-2026-000001"
                  className="flex-1 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                >
                  Track
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Category Shortcuts (Spec Section 13.1 & 15) */}
        <section className="mt-16 pt-10 border-t border-slate-200 dark:border-slate-800">
          <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-4">
            Common Infrastructure Categories
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {categoryShortcuts.map((cat) => (
              <Link
                key={cat.slug}
                href={`/citizen/report/new`}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500/50 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all text-center group cursor-pointer"
              >
                <span className="text-2xl block mb-1.5" aria-hidden="true">
                  {cat.icon}
                </span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 block">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Core Loop Section */}
        <section id="loop" className="mt-14 pt-8 border-t border-slate-200 dark:border-slate-800">
          <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-4">
            The 8-Step Civic Incident Lifecycle
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {[
              "1. See",
              "2. Report",
              "3. Locate",
              "4. Verify",
              "5. Assign",
              "6. Fix",
              "7. Confirm",
              "8. Learn",
            ].map((step, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-center"
              >
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {step}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500">
        Chigir Ale — Civic Infrastructure Intelligence &amp; Incident Management
      </footer>
    </div>
  );
}
