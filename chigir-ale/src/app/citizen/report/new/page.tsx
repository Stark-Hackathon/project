import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CategoryRepository } from "@/server/repositories/category.repository";
import { ReportWizard } from "@/features/reports/components/report-wizard";

export const metadata: Metadata = {
  title: "Report an Infrastructure Problem — Chigir Ale",
  description: "Submit a location-based civic infrastructure report to municipal authorities",
};

interface ReportNewPageProps {
  searchParams: Promise<{
    category?: string;
  }>;
}

export default async function NewReportPage({ searchParams }: ReportNewPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/sign-in?callbackUrl=/citizen/report/new");
  }

  const { category } = await searchParams;
  const categories = await CategoryRepository.listWithChildren();

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2 mb-6">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Report a Problem / ችግር ያመልክቱ
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
            Help fix your city. Submit photos, location, and details so the responsible team can inspect and resolve it.
          </p>
        </div>

        <ReportWizard
          categories={categories}
          defaultCategoryId={category}
        />
      </div>
    </main>
  );
}
