/**
 * Chigir Ale - Category Repository
 * Spec: Sections 55, 11 — Infrastructure Categories
 * Data-access layer for category queries. Business logic stays in services.
 */
import { prisma } from "@/lib/db/prisma";
import type { Category } from "@prisma/client";
import { CacheService } from "@/server/services/cache.service";

export class CategoryRepository {
  /**
   * List all active categories, optionally filtered by parentId.
   * Pass null to get root categories, undefined to get all.
   */
  static async listActive(parentId?: string | null): Promise<Category[]> {
    const cacheKey = `public:global:categories_active:${parentId ?? "all"}`;
    return CacheService.getOrSet(
      cacheKey,
      async () => {
        return prisma.category.findMany({
          where: {
            active: true,
            parentId: parentId === undefined ? undefined : parentId,
          },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        });
      },
      600
    );
  }

  /**
   * Find a single active category by slug.
   */
  static async findBySlug(slug: string): Promise<Category | null> {
    return prisma.category.findFirst({
      where: { slug, active: true },
    });
  }

  /**
   * Find a category by its internal UUID.
   */
  static async findById(id: string): Promise<Category | null> {
    return prisma.category.findUnique({ where: { id } });
  }

  /**
   * List all active root categories (no parent) with their active children.
   * Used by the citizen reporting step 1 (category selection).
   */
  static async listWithChildren(): Promise<(Category & { children: Category[] })[]> {
    return CacheService.getOrSet(
      "public:global:categories_with_children",
      async () => {
        return prisma.category.findMany({
          where: { active: true, parentId: null },
          include: {
            children: {
              where: { active: true },
              orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
            },
          },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        });
      },
      600
    );
  }
}
