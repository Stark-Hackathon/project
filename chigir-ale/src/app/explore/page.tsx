"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Droplet,
  Zap,
  AlertTriangle,
  Trash2,
  Car,
  Wifi,
  ChevronRight,
  PlusCircle,
  ThumbsUp,
  Shield,
  Layers,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

export default function ExploreIssuesPage() {
  const { t, isAmharic } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [upvotes, setUpvotes] = useState<Record<string, number>>({});

  const categories = useMemo(
    () => [
      { id: "all", label: t.explore.allCategories, icon: Layers },
      { id: "water", label: t.categories.water, icon: Droplet },
      { id: "electricity", label: t.categories.electricity, icon: Zap },
      { id: "roads", label: t.categories.roads, icon: AlertTriangle },
      { id: "waste", label: t.categories.waste, icon: Trash2 },
      { id: "traffic", label: t.categories.traffic, icon: Car },
      { id: "network", label: t.categories.network, icon: Wifi },
    ],
    [t]
  );

  const issues = useMemo(
    () => [
      {
        id: "CHI-2026-000012",
        title: isAmharic
          ? "በእግረኛ መንገድ ስር የተሰበረ ከፍተኛ ጫና ያለው ንጹሕ የውሃ ቧንቧ"
          : "High-pressure clean water pipe ruptured under pavement",
        category: "water",
        categoryName: t.categories.water,
        location: isAmharic ? "አፍሪካ ጎዳና፣ ኤድና ሞል ፊት ለፊት፣ ቦሌ" : "Africa Ave, opposite Edna Mall, Bole",
        description: isAmharic
          ? "ንጹሕ የመጠጥ ውሃ ለ8 ሰዓታት ወደ መንገዱ እየፈሰሰ የእግረኛ መሻገሪያውን አጥለቅልቆታል፤ የህዝብ ሀብትም እየባከነ ነው።"
          : "Clean drinking water has been gushing onto the roadway for 8 hours, flooding pedestrian crossings and wasting utility supply.",
        reportsCount: 19,
        status: t.statuses.inProgress,
        statusColor: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
        timeAgo: isAmharic ? "ከ2 ሰዓት በፊት" : "2 hours ago",
        icon: Droplet,
        iconColor: "text-blue-600 bg-blue-50 dark:bg-blue-950/50",
      },
      {
        id: "CHI-2026-000001",
        title: isAmharic
          ? "በቀኝ መስመር ላይ ያለ የተሽከርካሪ ጎማ የሚያበላሽ ትልቅ ጉድጓድ"
          : "Large pothole in the right lane causing vehicle tire damage",
        category: "roads",
        categoryName: t.categories.roads,
        location: isAmharic ? "ቦሌ መንገድ፣ መድኃኔዓለም አደባባይ አጠገብ" : "Bole Road near Medhanialem Roundabout",
        description: isAmharic
          ? "ከዝናብ በኋላ እየሰፋ የመጣ ጥልቅ አስፋልት ጉድጓድ። አሽከርካሪዎች ጎማ እንዳይፈነዳባቸው ድንገት ወደ ተቃራኒ አቅጣጫ እየታጠፉ ነው።"
          : "Deep asphalt crater expanding after rain. Multiple drivers swerving suddenly into opposing traffic to avoid rim punctures.",
        reportsCount: 14,
        status: t.statuses.verified,
        statusColor: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
        timeAgo: isAmharic ? "ከ4 ሰዓት በፊት" : "4 hours ago",
        icon: AlertTriangle,
        iconColor: "text-amber-600 bg-amber-50 dark:bg-amber-950/50",
      },
      {
        id: "CHI-2026-000004",
        title: isAmharic
          ? "የማዘጋጃ ቤት ቆሻሻ ገንዳዎች ሞልተው የእግረኛውን መንገድ ዘግተውታል"
          : "Municipal dumpsters overflowing onto pedestrian sidewalk",
        category: "waste",
        categoryName: t.categories.waste,
        location: isAmharic ? "ኦሎምፒያ አደባባይ፣ ቂርቆስ ክፍለ ከተማ" : "Olympia Roundabout, Kirkos Sub-City",
        description: isAmharic
          ? "የቆሻሻ ገንዳዎች ሞልተው መንገድ ላይ ተበትነዋል። የባዘኑ ውሾች በመሰብሰባቸው እግረኞች ወደ መኪና መንገድ ለመውረድ ተገደዋል።"
          : "Waste bins full and spreading across the walkway. Stray dogs gathering, forcing pedestrians into the active highway.",
        reportsCount: 8,
        status: t.statuses.assigned,
        statusColor: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300",
        timeAgo: isAmharic ? "ከ6 ሰዓት በፊት" : "6 hours ago",
        icon: Trash2,
        iconColor: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50",
      },
      {
        id: "CHI-2026-000018",
        title: isAmharic
          ? "በከባድ ዝናብ ወቅት የሚንቦገቦግ ትራንስፎርመር፣ መብራት ጠፍቷል"
          : "Sub-transformer sparking during heavy rain, power outage",
        category: "electricity",
        categoryName: t.categories.electricity,
        location: isAmharic ? "ገርጂ፣ ዩኒቲ ዩኒቨርሲቲ አጠገብ" : "Gerji, near Unity University",
        description: isAmharic
          ? "በትራንስፎርመሩ ላይ በዝናብ ወቅት ሰማያዊ ብልጭታ ይታያል። መላው የመኖሪያ መንደር ያለ መብራት ቀርቷል።"
          : "Overhead transformer unit flashing bright blue sparks during rainfall. Entire residential sector without electricity.",
        reportsCount: 7,
        status: t.statuses.underReview,
        statusColor: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300",
        timeAgo: isAmharic ? "ከ1 ቀን በፊት" : "1 day ago",
        icon: Zap,
        iconColor: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/50",
      },
      {
        id: "CHI-2026-000022",
        title: isAmharic
          ? "የተበጠሰ የኢንተርኔት ፋይበር ኬብል በእግረኛ አንገት ከፍታ ተንጠልጥሏል"
          : "Downed optical internet cable hanging at head height",
        category: "network",
        categoryName: t.categories.network,
        location: isAmharic ? "ካዛንቺስ፣ ጊኒ ኮናክሪ ጎዳና" : "Kazanchis, Guinea Conakry St",
        description: isAmharic
          ? "ከምሶሶ የወለቀ ከባድ የቴሌኮም ኬብል በእግረኛ መንገድ ላይ አደጋ በሚያሰጋ መልኩ ተንጠልጥሏል።"
          : "Heavy telecom cable unfastened from pole, hanging dangerously across pedestrian footpath.",
        reportsCount: 6,
        status: t.statuses.verified,
        statusColor: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
        timeAgo: isAmharic ? "ከ1 ቀን በፊት" : "1 day ago",
        icon: Wifi,
        iconColor: "text-purple-600 bg-purple-50 dark:bg-purple-950/50",
      },
      {
        id: "CHI-2026-000015",
        title: isAmharic
          ? "በተጨናነቀ መሻገሪያ ላይ የተበላሸ የእግረኛ ትራፊክ መብራት"
          : "Broken pedestrian traffic signal at crowded intersection",
        category: "traffic",
        categoryName: t.categories.traffic,
        location: isAmharic ? "መስቀል አደባባይ፣ ስታዲየም መሻገሪያ" : "Meskel Square, Stadium crossing",
        description: isAmharic
          ? "የእግረኛ ማለፊያ መብራት በቀይ ላይ ብቻ ቆሟል። ተላላፊዎች በፍጥነት በሚያልፉ አውቶቡሶች መካከል ለመሮጥ ይገደዳሉ።"
          : "Pedestrian walk signal stuck on red continuously. Commuters forced to sprint between fast-moving buses.",
        reportsCount: 5,
        status: t.statuses.resolved,
        statusColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
        timeAgo: isAmharic ? "ከ3 ሰዓት በፊት ተፈታ" : "Fixed 3h ago",
        icon: Car,
        iconColor: "text-red-600 bg-red-50 dark:bg-red-950/50",
      },
      {
        id: "CHI-2026-000028",
        title: isAmharic
          ? "በደለል የተደፈነ የፍሳሽ ቦይ መንገድ ላይ ጎርፍ እንዲተኛ አድርጓል"
          : "Drainage gutter clogged with silt causing road inundation",
        category: "water",
        categoryName: t.categories.water,
        location: isAmharic ? "ፒያሳ፣ ቸርችል ጎዳና አጠገብ" : "Piazza near Churchill Ave",
        description: isAmharic
          ? "የከተማው የፍሳሽ ቦይ በፕላስቲክና በጠጠር በመደፈኑ የዝናብ ውሃ ወደ መንገዱ ሞልቷል።"
          : "Storm runoff overflowed curb due to gravel and plastic blockages in municipal trench.",
        reportsCount: 9,
        status: t.statuses.inProgress,
        statusColor: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
        timeAgo: isAmharic ? "ከ3 ቀናት በፊት" : "3 days ago",
        icon: Droplet,
        iconColor: "text-blue-600 bg-blue-50 dark:bg-blue-950/50",
      },
    ],
    [t, isAmharic]
  );

  const filteredIssues = issues.filter((issue) => {
    const matchesCategory =
      selectedCategory === "all" || issue.category === selectedCategory;
    const matchesStatus =
      selectedStatus === "all" ||
      issue.status.toLowerCase().replace(/\s+/g, "-") === selectedStatus;
    const matchesSearch =
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const handleUpvote = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUpvotes((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  return (
    <main className="min-h-screen bg-[#fafcfb] dark:bg-slate-950 py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Strip */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-2">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isAmharic ? "ይፋዊ የዜግነት መዝገብ" : "Public Civic Log"}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 dark:text-white">
              {t.explore.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2 max-w-xl">
              {t.explore.subtitle}
            </p>
          </div>

          <Link
            href="/report"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#0f3d2e] hover:bg-[#134e3a] text-white font-extrabold text-sm shadow-md transition-all hover:scale-[1.02] cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>{isAmharic ? "አዲስ ችግር ያመልክቱ" : "Report a New Issue"}</span>
          </Link>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.explore.searchPlaceholder}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full sm:w-48 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="all">{t.explore.statusAll}</option>
              <option value="verified">{t.statuses.verified}</option>
              <option value="in-progress">{t.statuses.inProgress}</option>
              <option value="assigned">{t.statuses.assigned}</option>
              <option value="under-review">{t.statuses.underReview}</option>
              <option value="resolved">{t.statuses.resolved}</option>
            </select>
          </div>

          {/* Category Pill Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2">
            {categories.map((c) => {
              const Icon = c.icon;
              const isSelected = selectedCategory === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-[#0f3d2e] text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Issues Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIssues.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 text-sm">
              {t.explore.noReportsFound}
            </div>
          ) : (
            filteredIssues.map((issue) => {
              const Icon = issue.icon;
              const extraUpvotes = upvotes[issue.id] || 0;
              return (
                <div
                  key={issue.id}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-emerald-600/70 dark:hover:border-emerald-500/70 transition-all hover:shadow-lg flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${issue.statusColor}`}>
                        {issue.status}
                      </span>
                      <span className="font-mono text-xs text-slate-400">
                        {issue.id}
                      </span>
                    </div>

                    <div className="flex items-start gap-3.5 mb-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${issue.iconColor}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition leading-snug">
                          {issue.title}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{issue.location}</span>
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed mb-4">
                      {issue.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    {/* Upvote / Confirm button */}
                    <button
                      type="button"
                      onClick={(e) => handleUpvote(issue.id, e)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold hover:bg-emerald-100 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{issue.reportsCount + extraUpvotes} {isAmharic ? "ተረጋግጧል" : "Confirmed"}</span>
                    </button>

                    <Link
                      href={`/reports/${issue.id}`}
                      className="font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center gap-0.5"
                    >
                      <span>{isAmharic ? "ዝርዝር ይመልከቱ" : "Inspect"}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
