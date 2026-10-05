import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signOutAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Citizen Profile — Chigir Ale",
  description: "Account settings, notification preferences, and privacy information",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/sign-in?callbackUrl=/citizen/profile");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      preferredLanguage: true,
      createdAt: true,
      _count: {
        select: {
          reports: true,
          confirmations: true,
          upvotes: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/auth/sign-in");
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Citizen Profile &amp; Settings / የተጠቃሚ መገለጫ
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your personal civic account, communication preferences, and data privacy.
          </p>
        </div>

        {/* Civic Activity Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center p-4">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {user._count.reports}
            </span>
            <span className="text-xs text-slate-500 block mt-1">Reports Created</span>
          </Card>

          <Card className="text-center p-4">
            <span className="text-2xl font-bold text-sky-600 dark:text-sky-400">
              {user._count.confirmations}
            </span>
            <span className="text-xs text-slate-500 block mt-1">Issues Confirmed</span>
          </Card>

          <Card className="text-center p-4">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {user._count.upvotes}
            </span>
            <span className="text-xs text-slate-500 block mt-1">Upvotes Given</span>
          </Card>
        </div>

        {/* Personal Details */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-400 block">Full Name</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {user.name}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block">Email Address</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {user.email}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block">Preferred Language</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {user.preferredLanguage === "am" ? "Amharic (አማርኛ)" : "English"}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block">Member Since</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Governance (Spec Section 18 & 117) */}
        <Card>
          <CardHeader>
            <CardTitle>Civic Privacy &amp; Data Governance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <p>
              🛡️ <strong>Location Privacy:</strong> Your exact GPS coordinates are encrypted and accessible only to authorized municipal field dispatchers. On public dashboards and maps, locations are generalized to protect home privacy.
            </p>
            <p>
              📜 <strong>Evidence Integrity:</strong> Photographs uploaded to Chigir Ale are preserved in an audit-tracked domain storage layer for official municipal verification.
            </p>
          </CardContent>
        </Card>

        {/* Sign Out Action */}
        <div className="pt-2 flex justify-end">
          <form action={signOutAction}>
            <Button type="submit" variant="outline" className="text-rose-600 hover:text-rose-700">
              Sign Out of Chigir Ale
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
