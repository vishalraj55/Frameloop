"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, Search, Compass, User, PlusSquare } from "lucide-react";

export default function NavBar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const username = session?.user?.username;

  const active = (path: string) =>
    pathname === path
      ? "text-white"
      : "text-neutral-400 hover:text-white";

  return (
    <>
      {/* MOBILE */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-md border-t border-neutral-800 md:hidden">
        <div className="mx-auto max-w-lg h-14 flex items-center justify-around px-6">
          <Link href="/feed" className={active("/feed")}>
            <Home size={24} strokeWidth={1.6} />
          </Link>

          <Link href="/search" className={active("/search")}>
            <Search size={24} strokeWidth={1.6} />
          </Link>

          <Link href="/upload" className={active("/upload")}>
            <PlusSquare size={24} strokeWidth={1.6} />
          </Link>

          <Link href="/explore" className={active("/explore")}>
            <Compass size={24} strokeWidth={1.6} />
          </Link>

          {status === "loading" ? (
            <div className="w-6 h-6" />
          ) : username ? (
            <Link href={`/profile/${username}`} className={active(`/profile/${username}`)}>
              <User size={24} strokeWidth={1.6} />
            </Link>
          ) : (
            <Link href="/login" className={active("/login")}>
              <User size={24} strokeWidth={1.6} />
            </Link>
          )}
        </div>
      </nav>

      <aside className="hidden md:flex fixed top-0 left-0 h-screen z-40 bg-black border-r border-black flex-col justify-between py-8">

        <div className="group/sidebar flex flex-col h-full w-20 hover:w-60 transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden">

          <div className="px-6 mb-10">
            <span className="text-white text-xl font-semibold tracking-tight opacity-0 group-hover/sidebar:opacity-100 transition-all duration-500 delay-100 whitespace-nowrap">
              Frameloop
            </span>
          </div>


          <div className="flex flex-col gap-2 px-3">

            <NavItem href="/feed" label="Home" active={active("/feed")}>
              <Home size={26} strokeWidth={1.7} />
            </NavItem>

            <NavItem href="/search" label="Search" active={active("/search")}>
              <Search size={26} strokeWidth={1.7} />
            </NavItem>

            <NavItem href="/explore" label="Explore" active={active("/explore")}>
              <Compass size={26} strokeWidth={1.7} />
            </NavItem>

            <NavItem href="/upload" label="Create" active={active("/upload")}>
              <PlusSquare size={26} strokeWidth={1.7} />
            </NavItem>

            {status === "loading" ? (
              <div className="w-6 h-6 ml-3" />
            ) : username ? (
              <NavItem
                href={`/profile/${username}`}
                label="Profile"
                active={active(`/profile/${username}`)}
              >
                <User size={26} strokeWidth={1.7} />
              </NavItem>
            ) : (
              <NavItem href="/login" label="Login" active={active("/login")}>
                <User size={26} strokeWidth={1.7} />
              </NavItem>
            )}
          </div>

          <div className="flex-1" />
        </div>
      </aside>
    </>
  );
}

function NavItem({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-5 px-4 py-3 rounded-xl transition-colors duration-200 ${active} hover:bg-neutral-900/80`}
    >
      {/* Icon */}
      <div className="min-w-7 flex justify-center">
        {children}
      </div>
      <span className="opacity-0 -translate-x-3 group-hover/sidebar:opacity-100 group-hover/sidebar:translate-x-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] delay-75 text-[15px] font-medium tracking-tight whitespace-nowrap">
        {label}
      </span>
    </Link>
  );
}