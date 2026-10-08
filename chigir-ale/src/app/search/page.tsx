import { Metadata } from "next";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { CategoryRepository } from "@/server/repositories/category.repository";
import { SearchService } from "@/server/services/search.service";
import { SearchView } from "@/features/search/components/search-view";

export const metadata: Metadata = {
  title: "Search Civic Reports — Chigr Ale",
  description: "Search infrastructure reports by public reference, category, subcity, and keywords.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ref?: string; category?: string }>;
}) {
  const params = await searchParams;
  const user = await getAuthenticatedUser();
  const categories = await CategoryRepository.listActive();

  const searchResults = await SearchService.searchReports({
    query: params.q,
    reference: params.ref,
    categoryId: params.category,
    limit: 12,
    offset: 0,
    onlyPublic: !user && !params.ref && !params.q?.startsWith("CHI-"),
  });

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <SearchView
        initialResults={searchResults.items}
        initialTotalCount={searchResults.totalCount}
        initialQuery={params.q || params.ref || ""}
        categories={categories}
        isAuthenticated={Boolean(user)}
      />
    </main>
  );
}
