import { auth } from "@/auth";
import Link from "next/link";
import { signOutAction } from "@/features/auth/actions";
import { NotificationBell } from "@/features/notifications/components/notification-bell";

export async function AuthNav() {
  const session = await auth();

  if (!session?.user) {
    return (
      <nav className="flex gap-4 items-center" aria-label="Authentication navigation">
        <Link
          href="/citizen/report/new"
          className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          + Report an Issue
        </Link>
        <Link
          href="/map"
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
        >
          City Map
        </Link>
        <Link
          href="/auth/sign-in"
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
        >
          Sign in
        </Link>
        <Link
          href="/auth/sign-up"
          className="text-sm bg-emerald-600 text-white px-3.5 py-1.5 rounded-lg hover:bg-emerald-700 font-medium"
        >
          Sign up
        </Link>
      </nav>
    );
  }

  return (
    <nav className="flex gap-4 items-center" aria-label="User navigation">
      <Link
        href="/citizen/report/new"
        className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
      >
        + Report Issue
      </Link>
      <Link
        href="/citizen/nearby"
        className="text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600"
      >
        Nearby Issues
      </Link>
      <Link
        href="/map"
        className="text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600"
      >
        City Map
      </Link>
      <Link
        href="/citizen/reports"
        className="text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600"
      >
        My Reports
      </Link>
      <Link
        href="/citizen/profile"
        className="text-sm font-medium text-gray-900 dark:text-white hover:text-emerald-600"
      >
        Profile
      </Link>
      <NotificationBell />
      <Link
        href="/authority"
        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90"
      >
        Authority Portal
      </Link>
      <form action={signOutAction}>
        <button
          type="submit"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 cursor-pointer"
        >
          Sign out
        </button>
      </form>
    </nav>
  );
}
