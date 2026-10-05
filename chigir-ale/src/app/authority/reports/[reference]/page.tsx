import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthorityRepository } from "@/server/repositories/authority.repository";
import { AuthorityReportDetailView } from "@/features/authority/components/authority-report-detail-view";

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

  const [departments, staff] = await Promise.all([
    AuthorityRepository.listDepartments(report.organizationId ?? undefined),
    AuthorityRepository.listStaffMembers(report.organizationId ?? undefined),
  ]);

  return (
    <AuthorityReportDetailView
      report={report}
      departments={departments}
      staff={staff}
      currentOrganizationId={report.organizationId ?? departments[0]?.organizationId ?? ""}
    />
  );
}
