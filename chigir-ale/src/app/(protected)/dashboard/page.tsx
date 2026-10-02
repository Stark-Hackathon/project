import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { signOutAction } from "@/features/auth/actions";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/sign-in");

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Welcome back, {session.user.name}
            </p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Account Information</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-4">
              <dt className="text-gray-500 dark:text-gray-400 w-24">Name</dt>
              <dd className="text-gray-900 dark:text-white">{session.user.name}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="text-gray-500 dark:text-gray-400 w-24">Email</dt>
              <dd className="text-gray-900 dark:text-white">{session.user.email}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-6">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <strong>Iteration 1 stub:</strong> Full dashboard (citizen, authority, admin views) will be implemented in subsequent iterations.
          </p>
        </div>
      </div>
    </main>
  );
}
