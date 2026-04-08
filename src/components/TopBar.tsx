"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useParams, usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

export default function TopBar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const params = useParams();

  const isProfilePage = pathname.startsWith("/profile/");
  const profileUsername = params?.username as string | undefined;

  let title = "Frameloop";

  if (isProfilePage && profileUsername) {
    title = profileUsername;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-[#262626]">
      
      <div className="max-w-lg mx-auto h-12 flex items-center justify-between px-4">

        {/* LEFT SPACER (keeps center aligned) */}
        {/* <div className="w-8" /> */}

        {/* CENTER TITLE */}
        <h1
          className="text-white text-lg tracking-wide select-none truncate max-w-[60%] text-left"
          style={{
            fontFamily:
              isProfilePage
                ? "system-ui, -apple-system, sans-serif"
                : '"Billabong", cursive, "Segoe Script", "Apple Chancery"',
          }}
        >
          {title}
        </h1>

        {/* RIGHT */}
        <div className="flex items-center">
          {session ? (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 rounded-full hover:bg-[#1a1a1a] transition"
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
  );
}