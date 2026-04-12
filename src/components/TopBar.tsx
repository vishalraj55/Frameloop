"use client";

import { useMemo, useCallback } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Settings, LogOut } from "lucide-react";

type Params = { username?: string };

export default function TopBar() {
  const { data } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { username } = useParams<Params>();

  const isProfile = useMemo(
    () => pathname?.startsWith("/profile/") && !!username,
    [pathname, username]
  );
  const isOwnProfile = useMemo(
    () => isProfile && data?.user?.username === username,
    [isProfile, data?.user?.username, username]
  );

  const title = useMemo(
    () => (isProfile ? username : "Frameloop"),
    [isProfile, username]
  );

  const font = useMemo(
    () =>
      isProfile
        ? "system-ui,-apple-system,sans-serif"
        : '"Billabong",cursive,"Segoe Script","Apple Chancery"',
    [isProfile]
  );

  const handleSignOut = useCallback(
    () => signOut({ callbackUrl: "/login" }),
    []
  );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 bg-black border-b border-[#262626] h-12">
        <div className="max-w-lg mx-auto h-full flex items-center justify-between px-4">
          <h1
            className="text-white text-lg tracking-wide select-none truncate max-w-[60%]"
            style={{ fontFamily: font }}
          >
            {title}
          </h1>

          <div className="flex items-center gap-1">
            {isOwnProfile && (
              <button
                onClick={() => router.push("/settings")}
                className="p-2 rounded-full hover:bg-[#1a1a1a] transition"
                aria-label="Settings"
              >
                <Settings size={22} strokeWidth={1.8} className="text-white" />
              </button>
            )}

            {data ? (
              <button
                onClick={handleSignOut}
                className="p-2 rounded-full hover:bg-[#1a1a1a] transition"
                aria-label="Sign out"
              >
                <LogOut size={22} strokeWidth={1.8} className="text-white" />
              </button>
            ) : (
              <Link
                href="/login"
                className="text-white text-sm font-semibold hover:opacity-80 transition"
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="h-12 w-full shrink-0" />
    </>
  );
}