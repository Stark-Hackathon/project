import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Auth Error — Chigr Ale",
};

export default function AuthErrorPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Authentication Error</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          An error occurred during authentication. Please try again.
        </p>
        <a
          href="/auth/sign-in"
          className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 font-medium"
        >
          Back to Sign In
        </a>
      </div>
    </main>
  );
}
