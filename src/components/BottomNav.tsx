"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
// PlusSquare
import { Home, Search, Compass, User } from "lucide-react";

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
          <Home size={24} stroke="white" strokeWidth={1.5} />
        </Link>

        <Link href="/search" className={active("/search")}>
          <Search size={24} stroke="white" strokeWidth={1.5} />
        </Link>

        {/* <Link href="/upload" className={active("/upload")}>
          <PlusSquare size={24} stroke="white" strokeWidth={1.5} />
        </Link> */}

        <Link href="/explore" className={active("/explore")}>
          <Compass size={24} stroke="white" strokeWidth={1.5} />
        </Link>

        {/*profile link */}
        {status === "loading" ? (
          <div className="w-6 h-6" /> 
        ) : username ? (
          <Link
            href={`/profile/${username}`}
            className={active(`/profile/${username}`)}
          >
            <User size={24} stroke="white" strokeWidth={1.5} />
          </Link>
        ) : (
          <Link href="/login" className={active("/login")}>
            <User size={24} stroke="white" strokeWidth={1.5} />
          </Link>
        )}

      </div>
    </nav>
  );
}