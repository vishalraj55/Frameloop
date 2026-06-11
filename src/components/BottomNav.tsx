"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Home,
  Search,
  Compass,
  User as UserIcon,
  PlusSquare,
  Settings,
  LogOut,
} from "lucide-react";

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, username, avatarUrl, loading, logout } = useAuth();

  const isOwnProfile = !!username && pathname === `/profile/${username}`;

  const active = (path: string) =>
    pathname === path ? "text-white" : "text-neutral-400 hover:text-white";

  const handleSignOut = async () => {
    await logout();
    router.push("/login");
  };

  const profilePath = username ? `/profile/${username}` : "/login";
  const navRoutes = ["/feed", "/search", "/upload", "/explore", profilePath];
  const activeIndex = navRoutes.findIndex((r) => pathname === r);

  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const [pillStyle, setPillStyle] = useState({
    left: -100,
    width: 48,
    opacity: 0,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeIndex === -1) {
        setPillStyle((s) => ({ ...s, opacity: 0 }));
        return;
      }
      const el = itemRefs.current[activeIndex];
      if (!el) return;
      const parent = el.closest("div");
      if (!parent) return;
      const parentRect = parent.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      setPillStyle({
        left: elRect.left - parentRect.left - 16,
        width: elRect.width + 32,
        opacity: 1,
      });
    }, 0);

    return () => clearTimeout(timer);
  }, [activeIndex, loading]);
  const setRef = (index: number) => (el: HTMLElement | null) => {
    itemRefs.current[index] = el;
  };

  return (
    <>
      {/* Mobile bottom nav */}
      <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 md:hidden">
        <div
          className="relative flex items-center justify-around gap-2 px-6 h-16 rounded-full backdrop-blur-xl shadow-2xl min-w-[320px]"
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          {/* Sliding pill */}
          <span
            className="absolute top-1/2 -translate-y-1/2 h-12 rounded-full pointer-events-none backdrop-blur-md"
            style={{
              left: pillStyle.left,
              width: pillStyle.width,
              opacity: pillStyle.opacity,
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
              transition:
                "left 350ms cubic-bezier(0.16,1,0.3,1), width 350ms cubic-bezier(0.16,1,0.3,1), opacity 200ms ease",
            }}
          />

          <Link
            ref={setRef(0)}
            href="/feed"
            className={`relative z-10 ${active("/feed")}`}
          >
            <Home size={24} strokeWidth={1.6} />
          </Link>
          <Link
            ref={setRef(1)}
            href="/search"
            className={`relative z-10 ${active("/search")}`}
          >
            <Search size={24} strokeWidth={1.6} />
          </Link>
          <Link
            ref={setRef(2)}
            href="/upload"
            className={`relative z-10 ${active("/upload")}`}
          >
            <PlusSquare size={24} strokeWidth={1.6} />
          </Link>
          <Link
            ref={setRef(3)}
            href="/explore"
            className={`relative z-10 ${active("/explore")}`}
          >
            <Compass size={24} strokeWidth={1.6} />
          </Link>
          {loading ? (
            <div className="w-6 h-6 relative z-10" />
          ) : username ? (
            <Link
              ref={setRef(4)}
              href={profilePath}
              className={`relative z-10 ${active(profilePath)}`}
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="avatar"
                  width={26}
                  height={26}
                  className="rounded-full object-cover"
                />
              ) : (
                <UserIcon size={24} strokeWidth={1.6} />
              )}
            </Link>
          ) : (
            <Link
              ref={setRef(4)}
              href="/login"
              className={`relative z-10 ${active("/login")}`}
            >
              <UserIcon size={24} strokeWidth={1.6} />
            </Link>
          )}
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed top-0 left-0 h-screen z-40 bg-black border-r border-black flex-col py-8">
        <div className="group/sidebar flex flex-col h-full w-20 hover:w-60 transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden">
          <div className="px-6 mb-10" />
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
            {loading ? (
              <div className="w-6 h-6 ml-3" />
            ) : username ? (
              <NavItem href={`/profile/${username}`} label="Profile" active={active(`/profile/${username}`)}>
                <UserIcon size={26} strokeWidth={1.7} />
              </NavItem>
            ) : (
              <NavItem href="/login" label="Login" active={active("/login")}>
                <UserIcon size={26} strokeWidth={1.7} />
              </NavItem>
            )}
          </div>
          <div className="flex-1" />
          <div className="flex flex-col gap-2 px-3">
            {isOwnProfile && (
              <button
                onClick={() => router.push("/settings")}
                className="flex items-center gap-5 px-4 py-3 rounded-xl transition-colors duration-200 text-neutral-400 hover:text-white hover:bg-neutral-900/80 w-full"
              >
                <div className="min-w-7 flex justify-center">
                  <Settings size={26} strokeWidth={1.7} />
                </div>
                <span className="opacity-0 -translate-x-3 group-hover/sidebar:opacity-100 group-hover/sidebar:translate-x-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] delay-75 text-[15px] font-medium tracking-tight whitespace-nowrap">
                  Settings
                </span>
              </button>
            )}
            {user ? (
              <button
                onClick={() => void handleSignOut()}
                className="flex items-center gap-5 px-4 py-3 rounded-xl transition-colors duration-200 text-neutral-400 hover:text-white hover:bg-neutral-900/80 w-full"
              >
                <div className="min-w-7 flex justify-center">
                  <LogOut size={26} strokeWidth={1.7} />
                </div>
                <span className="opacity-0 -translate-x-3 group-hover/sidebar:opacity-100 group-hover/sidebar:translate-x-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] delay-75 text-[15px] font-medium tracking-tight whitespace-nowrap">
                  Log out
                </span>
              </button>
            ) : (
              <NavItem href="/login" label="Log in" active={active("/login")}>
                <LogOut size={26} strokeWidth={1.7} className="rotate-180" />
              </NavItem>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

function NavItem({
  href, label, active, children,
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
      <div className="min-w-7 flex justify-center">{children}</div>
      <span className="opacity-0 -translate-x-3 group-hover/sidebar:opacity-100 group-hover/sidebar:translate-x-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] delay-75 text-[15px] font-medium tracking-tight whitespace-nowrap">
        {label}
      </span>
    </Link>
  );
}