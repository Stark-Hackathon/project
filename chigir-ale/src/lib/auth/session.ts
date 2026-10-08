/**
 * Chigir Ale - Server-Side Session Utilities
 * Spec: Section 7.2 (Authorization — server-side enforcement)
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import type { MembershipRole } from "@prisma/client";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
};

/**
 * Get the currently authenticated user from the server session.
 * Returns null if not authenticated.
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  try {
    const session = await auth();
    if (!session?.user?.id) return null;
    return {
      id: session.user.id,
      name: session.user.name ?? "",
      email: session.user.email ?? "",
    };
  } catch {
    return null;
  }
}

/**
 * Require an authenticated user. Throws if not authenticated.
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("UNAUTHORIZED: Authentication required.");
  }
  return user;
}

/**
 * Get the user's active membership in a given organization.
 * Returns null if the user is not a member.
 */
export async function getMembership(
  userId: string,
  organizationId: string
) {
  return prisma.membership.findFirst({
    where: {
      userId,
      organizationId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      role: true,
      status: true,
      organization: { select: { id: true, slug: true, name: true, status: true } },
    },
  });
}

/**
 * Require membership in an organization with at least the specified role.
 * Throws if the user doesn't have the required access.
 */
const ROLE_HIERARCHY: Record<MembershipRole, number> = {
  CITIZEN: 0,
  FIELD_WORKER: 1,
  STAFF: 2,
  ANALYST: 3,
  DEPARTMENT_MANAGER: 4,
  ORG_ADMIN: 5,
  PLATFORM_ADMIN: 6,
};

export async function requireOrgAccess(
  userId: string,
  organizationId: string,
  minimumRole: MembershipRole = "STAFF"
) {
  const membership = await getMembership(userId, organizationId);

  if (!membership) {
    throw new Error("FORBIDDEN: Not a member of this organization.");
  }

  if (membership.organization.status !== "ACTIVE") {
    throw new Error("FORBIDDEN: Organization is not active.");
  }

  if (ROLE_HIERARCHY[membership.role] < ROLE_HIERARCHY[minimumRole]) {
    throw new Error(`FORBIDDEN: Requires at least ${minimumRole} role.`);
  }

  return membership;
}

/**
 * Check if a user is a Platform Admin (highest privilege).
 */
export async function isPlatformAdmin(userId: string): Promise<boolean> {
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      role: "PLATFORM_ADMIN",
      status: "ACTIVE",
    },
  });
  return membership !== null;
}

/**
 * Require the user to be authenticated and have authority staff privileges.
 */
export async function requireAuthorityUser() {
  const user = await requireAuth();

  const membership = await prisma.membership.findFirst({
    where: {
      userId: user.id,
      status: "ACTIVE",
      role: { in: ["STAFF", "FIELD_WORKER", "DEPARTMENT_MANAGER", "ORG_ADMIN", "PLATFORM_ADMIN"] },
    },
    include: {
      organization: true,
    },
  });

  if (!membership) {
    throw new Error("FORBIDDEN: Requires active authority staff membership.");
  }

  return {
    ...user,
    membership,
  };
}
