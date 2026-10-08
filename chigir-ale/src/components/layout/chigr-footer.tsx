"use client";

import React from "react";
import Link from "next/link";
import {
  Mic,
  MapPin,
  Shield,
  Layers,
  Heart,
  Droplet,
  Zap,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

export function ChigrFooter() {
  const { isAmharic, t } = useLanguage();

  return (
    <footer className="w-full bg-[#0a231b] text-slate-300 border-t border-emerald-950/40">
      {/* Top Banner CTA Strip */}
      <div className="border-b border-emerald-900/40 bg-gradient-to-r from-[#0f3d2e] to-[#0a231b] py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left space-y-1">
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {isAmharic ? "ዛሬ በአካባቢዎ ያስተዋሉት ችግር አለ?" : "Notice a problem in your neighborhood today?"}
            </h3>
            <p className="text-sm text-emerald-200/80 max-w-xl">
              {isAmharic
                ? "የውሃ መፍሰስ፣ የመብራት መጥፋት ወይም የመንገድ አደጋ? በማይክሮፎኑ ይናገሩ ወይም በሰከንዶች ውስጥ ይግለጹ።"
                : "Water leak, blackout, or road hazard? Speak into your mic or describe it in seconds."}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/report"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-950/30 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              <span>{t.nav.reportNow}</span>
            </Link>
            <Link
              href="/map"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-emerald-500/30 transition-colors"
            >
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>{isAmharic ? "ካርታውን ያስሱ" : "Explore Map"}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-md">
                <span className="text-xl leading-none">ች</span>
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-white block">
                  {isAmharic ? "ችግር አለ" : "Chigr Ale"}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 block -mt-1">
                  {isAmharic ? "ይዩት። ያመልክቱ። ያስተካክሉ።" : "See it. Report it. Improve it."}
                </span>
              </div>
            </Link>

            <p className="text-sm text-slate-300/80 leading-relaxed max-w-sm">
              {t.footer.description}
            </p>

            <div className="flex items-center gap-2 pt-2 text-xs text-emerald-400/90 font-semibold">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>
                {isAmharic
                  ? "ማንነት ሳይገለጽ ሪፖርት ይደረጋል፤ ምንም እንቅፋት የለም።"
                  : "Anonymous reporting by default. Zero barrier to entry."}
              </span>
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">
              {t.footer.platformHeading}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  {t.nav.home}
                </Link>
              </li>
              <li>
                <Link href="/report" className="hover:text-white transition-colors font-semibold text-emerald-300">
                  {t.nav.report}
                </Link>
              </li>
              <li>
                <Link href="/explore" className="hover:text-white transition-colors">
                  {t.nav.explore}
                </Link>
              </li>
              <li>
                <Link href="/map" className="hover:text-white transition-colors">
                  {t.nav.map}
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-white transition-colors">
                  {t.nav.howItWorks}
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  {t.nav.about}
                </Link>
              </li>
            </ul>
          </div>

          {/* Infrastructure Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">
              {t.footer.categoriesHeading}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/report" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Droplet className="w-3.5 h-3.5 text-blue-400" />
                  <span>{isAmharic ? "የውሃ መቋረጥ እና ፍሳሽ" : "Water & Pipe Leaks"}</span>
                </Link>
              </li>
              <li>
                <Link href="/report" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-yellow-400" />
                  <span>{isAmharic ? "የመብራት መጥፋት እና ማብሪያ" : "Power & Streetlights"}</span>
                </Link>
              </li>
              <li>
                <Link href="/report" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isAmharic ? "የመንገድ ብልሽት እና ጉድጓዶች" : "Roads & Potholes"}</span>
                </Link>
              </li>
              <li>
                <Link href="/report" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isAmharic ? "የቆሻሻ ክምችት እና ጽዳት" : "Sanitation & Waste"}</span>
                </Link>
              </li>
              <li>
                <Link href="/report" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>{isAmharic ? "የማህበረሰብ ተቋማት" : "Public Facilities"}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Technology & Community */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">
              {t.footer.techHeading}
            </h4>
            <ul className="space-y-2 text-sm text-slate-300/80">
              <li className="flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                <span>Vixovide Voice Engine</span>
              </li>
              <li>{isAmharic ? "የአማርኛ ንግግር ቅኝት" : "Amharic (አማርኛ) Speech"}</li>
              <li>{isAmharic ? "የቀጥታ ካርታ ዳሰሳ" : "Real-Time Map Clustering"}</li>
              <li>{isAmharic ? "የተረጋገጠ ማዘጋጃ ቤት መላኪያ" : "Verified Municipal Dispatch"}</li>
              <li>STARK Hackathon 2026</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 pt-8 border-t border-emerald-950/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            © {new Date().getFullYear()}{" "}
            <span className="font-bold text-white">{isAmharic ? "ችግር አለ" : "Chigr Ale"}</span>.{" "}
            {t.footer.rightsReserved}
          </p>
          <p className="flex items-center gap-1">
            <span>{isAmharic ? "ለአዲስ አበባ በቅንነት የተሰራ" : "Built for Addis Ababa with"}</span>
            <Heart className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            <span>{isAmharic ? "በዜግነት ፈጣሪዎች" : "by civic innovators"}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
