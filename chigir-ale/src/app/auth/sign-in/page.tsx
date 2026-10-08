import React from "react";
import { Metadata } from "next";
import { SignInForm } from "@/features/auth/components/sign-in-form";

export const metadata: Metadata = {
  title: "Sign In — Chigr Ale",
  description: "Sign in to your Chigr Ale account",
};

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Chigr Ale</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Sign in to your account</p>
        </div>
        <React.Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading form...</div>}>
          <SignInForm />
        </React.Suspense>
        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Don&apos;t have an account?{" "}
          <a href="/auth/sign-up" className="text-emerald-600 hover:text-emerald-700 font-medium">
            Create one
          </a>
        </p>
      </div>
    </main>
  );
}
