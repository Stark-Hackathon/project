"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  PlusCircle,
  MapPin,
  HelpCircle,
  Info,
  Layers,
  Home,
  Mic,
  ArrowRight,
  Globe,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

export function ChigrNavbar() {
  const pathname = usePathname();
  const { language, setLanguage, t, isAmharic } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Close mobile menu when pathname changes
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
  }

  // Elevation on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: t.nav.home, href: "/", icon: Home },
    { label: t.nav.report, href: "/report", icon: PlusCircle },
    { label: t.nav.explore, href: "/explore", icon: Layers },
    { label: t.nav.map, href: "/map", icon: MapPin },
    { label: t.nav.howItWorks, href: "/how-it-works", icon: HelpCircle },
    { label: t.nav.about, href: "/about", icon: Info },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-200 ${
          isScrolled
            ? "bg-white/95 dark:bg-slate-950/95 backdrop-blur-md shadow-[0_2px_14px_rgba(0,0,0,0.06)] border-b border-emerald-950/5 dark:border-emerald-500/10"
            : "bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-900"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Brand Logo & Wordmark */}
            <Link
              href="/"
              className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-xl px-1 py-1"
              aria-label="Chigr Ale Home"
            >
              <div className="w-10 h-10 rounded-xl bg-[#0f3d2e] dark:bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-950/20 group-hover:bg-[#134e3a] transition-colors">
                <span className="font-black text-xl tracking-tighter text-emerald-400 dark:text-emerald-100">
                  ች
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                  {isAmharic ? "ችግር አለ" : "Chigr Ale"}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 -mt-0.5">
                  {isAmharic ? "የማህበረሰብ ሪፖርት መድረክ" : "Civic Action Platform"}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav
              className="hidden lg:flex items-center gap-1.5"
              aria-label="Main Navigation"
            >
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all relative ${
                      active
                        ? "text-emerald-800 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/50 font-bold"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900"
                    }`}
                  >
                    <span>{link.label}</span>
                    {active && (
                      <span className="absolute bottom-0 left-3.5 right-3.5 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Primary Action & Mobile Hamburger */}
            <div className="flex items-center gap-2.5">
              {/* Bilingual Language Switcher Toggle */}
              <div
                className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-0.5 text-xs font-bold"
                role="group"
                aria-label="Language selection"
              >
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    language === "en"
                      ? "bg-[#0f3d2e] text-white shadow-sm font-black"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title="Switch to English"
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("am")}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    language === "am"
                      ? "bg-[#0f3d2e] text-white shadow-sm font-black"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title="ወደ አማርኛ ቀይር"
                >
                  አማ
                </button>
              </div>

              {/* Primary Green CTA */}
              <Link
                href="/report"
                className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0f3d2e] hover:bg-[#134e3a] text-white font-bold text-sm shadow-md shadow-emerald-950/20 hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <span>{t.nav.reportNow}</span>
              </Link>

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden w-11 h-11 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6 text-slate-900 dark:text-white" />
                ) : (
                  <Menu className="w-6 h-6 text-slate-900 dark:text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Sheet */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-20 z-40 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-2xl animate-in slide-in-from-top-4 duration-200">
            {/* Mobile Language Switcher Row */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>ቋንቋ / Language</span>
              </div>
              <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-0.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    language === "en"
                      ? "bg-[#0f3d2e] text-white shadow-sm font-black"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("am")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    language === "am"
                      ? "bg-[#0f3d2e] text-white shadow-sm font-black"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  አማርኛ
                </button>
              </div>
            </div>

            <nav className="flex flex-col space-y-1.5" aria-label="Mobile Navigation">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl text-base font-bold transition-colors ${
                      active
                        ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          active
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span>{link.label}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </Link>
                );
              })}
            </nav>

            {/* Prominent Mobile CTA */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/report"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#0f3d2e] text-white font-extrabold text-base shadow-lg shadow-emerald-950/20 active:scale-[0.99] transition-transform"
              >
                <Mic className="w-5 h-5 text-emerald-400" />
                <span>{t.nav.reportNow}</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
