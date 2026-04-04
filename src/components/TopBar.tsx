"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { PlusSquare, LogOut } from "lucide-react";

export default function TopBar() {
  const { data: session } = useSession();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-[#262626]">
      
      <div className="max-w-lg mx-auto h-12 flex items-center justify-between px-4">

        {/* LEFT (UPLOAD) */}
        <div className="flex items-center">
          {session && (
            <Link
              href="/upload"
              className="p-2 rounded-full hover:bg-[#1a1a1a] transition"
            >
              <PlusSquare size={24} strokeWidth={1.8} className="text-white" />
            </Link>
          )}
        </div>

        {/* CENTER LOGO */}
        <h1
          className="text-white text-lg tracking-wide select-none"
          style={{
            fontFamily:
              '"Billabong", cursive, "Segoe Script", "Apple Chancery"',
          }}
        >
          Frameloop
        </h1>

        {/* RIGHT (LOGOUT / LOGIN) */}
        <div className="flex items-center">
          {session ? (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 rounded-full hover:bg-[#1a1a1a] transition"
            >
              <LogOut size={24} strokeWidth={1.8} className="text-white" />
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