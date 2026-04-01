"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export default function NavBar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const username = session?.user?.username;

  const active = (path: string) =>
    pathname === path ? "opacity-100" : "opacity-50";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black border-t border-gray-900">
      <div className="mx-auto max-w-lg h-12 flex items-center justify-around px-4">

        <Link href="/feed" className={active("/feed")}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
            <path d="M3 10.5L12 3l9 7.5V21h-6v-6H9v6H3v-10.5z" />
          </svg>
        </Link>

        <Link href="/search" className={active("/search")}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
            <circle cx="11" cy="11" r="6" />
            <path d="M16.5 16.5L21 21" />
          </svg>
        </Link>

        <Link href="/upload" className={active("/upload")}>
          <div className="w-8 h-8 border-2 border-white rounded-md flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
        </Link>

        <Link href="/explore" className={active("/explore")}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
            <polygon points="12 3 19 21 12 17 5 21 12 3" strokeLinejoin="round" />
          </svg>
        </Link>

        {/* 🔥 FIXED PROFILE LINK */}
        {status === "loading" ? (
          <div className="w-6 h-6" /> // placeholder (prevents undefined render)
        ) : username ? (
          <Link
            href={`/profile/${username}`}
            className={active(`/profile/${username}`)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
              <circle cx="12" cy="8" r="3" />
              <path d="M5 21c0-3.5 3.5-6 7-6s7 2.5 7 6" />
            </svg>
          </Link>
        ) : (
          <Link href="/login" className={active("/login")}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
              <circle cx="12" cy="8" r="3" />
              <path d="M5 21c0-3.5 3.5-6 7-6s7 2.5 7 6" />
            </svg>
          </Link>
        )}

      </div>
    </nav>
  );
}