import Link from "next/link";
import { ShieldCheck, MapPin, Building2, Activity } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/20">
              CA
            </div>
            <div>
              <span className="font-semibold text-lg tracking-tight text-slate-900 dark:text-white">
                Chigir Ale
              </span>
              <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Baseline v0.1.0
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link
              href="#architecture"
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Architecture
            </Link>
            <Link
              href="#loop"
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Core Loop
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Hero */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 flex flex-col justify-center">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold mb-6">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            Iteration 0 — Engineering Baseline Established
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight mb-6">
            Civic infrastructure intelligence &amp; incident management.
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed mb-10">
            Chigir Ale connects residents with responsible authorities by turning real-world infrastructure failures into location-based, evidence-supported, trackable reports.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              TypeScript Strict Mode
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-medium">
              <MapPin className="w-4 h-4 text-blue-600" />
              Domain-Driven Architecture
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-medium">
              <Building2 className="w-4 h-4 text-purple-600" />
              PostgreSQL &amp; Prisma Ready
            </div>
          </div>
        </div>

        {/* Core Loop Section */}
        <section id="loop" className="mt-20 pt-12 border-t border-slate-200 dark:border-slate-800">
          <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-6">
            The Chigir Ale Core Lifecycle
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
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500 text-center">
        <p>Chigir Ale — Iterative Software Engineering Specification v1.0</p>
      </footer>
    </div>
  );
}
