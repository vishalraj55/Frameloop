"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { PlusSquare, LogOut } from "lucide-react";

export default function TopBar() {
  const { data: session } = useSession();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-11 bg-black border-b border-[#262626]">
      <div className="h-full max-w-lg mx-auto flex items-center justify-between px-4">

        <h1
          className="text-xl text-white select-none"
          style={{ fontFamily: 'cursive, "Segoe Script", "Apple Chancery"' }}
        >
          Frameloop
        </h1>

        <div className="flex items-center gap-4">
          {session ? (
            <>
              <Link href="/upload">
                <PlusSquare size={24} stroke="white" strokeWidth={1.5} />
              </Link>
              <button onClick={() => signOut({ callbackUrl: "/login" })}>
                <LogOut size={24} stroke="white" strokeWidth={1.5} />
              </button>
            </>
          ) : (
            <Link href="/login" className="text-white text-sm font-semibold">
              Log in
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}