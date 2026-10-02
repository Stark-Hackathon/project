import { auth } from "@/auth";
import Link from "next/link";
import { signOutAction } from "@/features/auth/actions";

export async function AuthNav() {
  const session = await auth();

  if (!session?.user) {
    return (
      <nav className="flex gap-3 items-center" aria-label="Authentication navigation">
        <Link
          href="/auth/sign-in"
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
        >
          Sign in
        </Link>
        <Link
          href="/auth/sign-up"
          className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 font-medium"
        >
          Create account
        </Link>
      </nav>
    );
  }

  return (
    <nav className="flex gap-3 items-center" aria-label="User navigation">
      <Link
        href="/dashboard"
        className="text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600"
      >
        {session.user.name}
      </Link>
      <form action={signOutAction}>
        <button
          type="submit"
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-red-600"
        >
          Sign out
        </button>
      </form>
    </nav>
  );
}
