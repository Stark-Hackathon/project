"use server";

/**
 * Chigir Ale - Auth Server Actions
 * Spec: Section 7.1 (Authentication requirements)
 */
import { signIn, signOut, auth } from "@/auth";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import type { Result } from "@/types";
import { RateLimitService } from "@/server/services/rate-limit.service";
import { PrivacyService } from "@/server/services/privacy.service";

const signUpSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  callbackUrl: z.string().optional(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

export async function signUpAction(
  data: SignUpInput
): Promise<Result<{ userId: string }>> {
  const parsed = signUpSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: new Error("Invalid input: " + parsed.error.message) };
  }

  const { name, email, password } = parsed.data;

  // Check for existing user
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: new Error("An account with this email already exists.") };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        status: "ACTIVE",
      },
      select: { id: true },
    });
    return { success: true, data: { userId: user.id } };
  } catch {
    return { success: false, error: new Error("Failed to create account. Please try again.") };
  }
}

export async function signInAction(
  data: SignInInput
): Promise<Result<{ redirectTo: string }>> {
  const parsed = signInSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: new Error("Invalid credentials.") };
  }

  const { email, password, callbackUrl } = parsed.data;

  // Rate Limiting on Login per Spec Section 81
  const rateLimit = RateLimitService.check(email, "LOGIN");
  if (!rateLimit.success) {
    return {
      success: false,
      error: new Error(
        `Too many login attempts. Please try again in ${rateLimit.retryAfterSeconds ?? 60} seconds.`
      ),
    };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    return { success: true, data: { redirectTo: callbackUrl ?? "/" } };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: new Error("Invalid email or password.") };
    }
    throw error;
  }
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirect: false });
}

export async function deleteAccountAction(): Promise<Result<{ success: boolean }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: new Error("Unauthorized: Must be logged in.") };
  }

  try {
    await PrivacyService.anonymizeUserAccount(session.user.id);
    await signOut({ redirect: false });
    return { success: true, data: { success: true } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Failed to delete account."),
    };
  }
}
