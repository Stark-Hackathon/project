import { redirect } from "next/navigation";

interface ReportsPageProps {
  searchParams: Promise<{
    ref?: string;
  }>;
}

export default async function ReportsRedirectPage({ searchParams }: ReportsPageProps) {
  const { ref } = await searchParams;
  if (ref && ref.trim()) {
    redirect(`/reports/${encodeURIComponent(ref.trim().toUpperCase())}`);
  }
  redirect("/");
}
