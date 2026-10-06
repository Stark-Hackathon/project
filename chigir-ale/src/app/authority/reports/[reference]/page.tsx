import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { AuthorityRepository } from "@/server/repositories/authority.repository";
import { AIService } from "@/server/services/ai/ai.service";
import { AIJobService } from "@/server/services/ai/ai-job.service";
import { AuthorityReportDetailView } from "@/features/authority/components/authority-report-detail-view";
import type { SmartRecommendation } from "@/server/services/ai/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ reference: string }>;
}): Promise<Metadata> {
  const { reference } = await params;
  return {
    title: `Triage Report #${reference} — Authority Portal`,
  };
}

export default async function AuthorityReportDetailPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;

  const report = await AuthorityRepository.getReportDetailByReference(reference);
  if (!report) {
    notFound();
  }

  const [departments, staff, categories, aiAnalyses, aiJobs] = await Promise.all([
    AuthorityRepository.listDepartments(report.organizationId ?? undefined),
    AuthorityRepository.listStaffMembers(report.organizationId ?? undefined),
    prisma.category.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    AIService.getReportAnalyses(report.id).catch(() => []),
    AIJobService.getReportJobs(report.id).catch(() => []),
  ]);

  const latestRecAnalysis = aiAnalyses.find((a: { type: string }) => a.type === "SMART_RECOMMENDATION");
  const aiRecommendation = latestRecAnalysis
    ? (latestRecAnalysis.result as unknown as SmartRecommendation)
    : null;

  return (
    <AuthorityReportDetailView
      report={report}
      departments={departments}
      staff={staff}
      currentOrganizationId={report.organizationId ?? departments[0]?.organizationId ?? ""}
      categories={categories}
      aiRecommendation={aiRecommendation}
      aiJobs={aiJobs}
    />
  );
}
