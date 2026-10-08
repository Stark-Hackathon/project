import React from "react";
import type { Metadata } from "next";
import { AuthorityRepository } from "@/server/repositories/authority.repository";
import { AuthorityDashboard } from "@/features/authority/components/authority-dashboard";

export const metadata: Metadata = {
  title: "Authority Dashboard — Chigr Ale",
  description: "Operational Cockpit for civic infrastructure triage, assignment, and resolution.",
};

export default async function AuthorityDashboardPage() {
  const metrics = await AuthorityRepository.getDashboardMetrics();

  return <AuthorityDashboard metrics={metrics} />;
}
