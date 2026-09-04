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
  Upload,
  Settings,
  LogOut,
} from "lucide-react";
import { useTheme, THEME_COLORS } from "@/context/ThemeContext";

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, username, avatarUrl, loading, logout } = useAuth();
  const { resolvedTheme } = useTheme();
  const c = THEME_COLORS[resolvedTheme];

  const isOwnProfile = !!username && pathname === `/profile/${username}`;

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
      const desiredLeft = elRect.left - parentRect.left - 22;
      const desiredRight = elRect.right - parentRect.left + 24;
      const left = Math.max(0, desiredLeft);
      const right = Math.min(parentRect.width, desiredRight);
      setPillStyle({
        left,
        width: Math.max(0, right - left),
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
          className="relative flex items-center justify-around gap-2 px-3 h-20 rounded-full backdrop-blur-2xl shadow-2xl min-w-[320px]"
          style={{
            background: hexToRgba(
              c.card,
              resolvedTheme === "dark" ? 0.45 : 0.6,
            ),
           // border: `1px solid ${hexToRgba(c.text, resolvedTheme === "dark" ? 0.08 : 0.06)}`,
            boxShadow:
              resolvedTheme === "dark"
                ? "0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)"
                : "0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.5)",
          }}
        >
          {/* Sliding pill */}
          <span
            className="absolute pointer-events-none rounded-full"
            style={{
              left: pillStyle.left,
              width: "70px",
              height: "55px",
              top: "50%",
              opacity: pillStyle.opacity,
              background: hexToRgba(
                c.text,
                resolvedTheme === "dark" ? 0.12 : 0.08,
              ),
             // border: `1px solid ${hexToRgba(c.text, resolvedTheme === "dark" ? 0.1 : 0.08)}`,
              boxShadow:
                resolvedTheme === "dark"
                  ? "inset 0 1px 0 rgba(255,255,255,0.08)"
                  : "inset 0 1px 0 rgba(255,255,255,0.6)",
              borderRadius: "9999px",
              transform: "translate3d(0, -50%, 0)",
              transition:
                "left 350ms cubic-bezier(0.16,1,0.3,1), " +
                "width 350ms cubic-bezier(0.16,1,0.3,1), " +
                "opacity 200ms ease",
              willChange: "left, width",
            }}
          />

          <Link
            ref={setRef(0)}
            href="/feed"
            className="relative z-10 transition-colors"
            style={{ color: pathname === "/feed" ? c.text : c.text }}
          >
            <Home size={26} strokeWidth={1.5} />
          </Link>
          <Link
            ref={setRef(1)}
            href="/search"
            className="relative z-10 transition-colors"
            style={{ color: pathname === "/search" ? c.text : c.text }}
          >
            <Search size={26} strokeWidth={1.6} />
          </Link>
          <Link
            ref={setRef(2)}
            href="/upload"
            className="relative z-10 transition-colors"
            style={{ color: pathname === "/upload" ? c.text : c.text }}
          >
            <Upload size={26} strokeWidth={1.6} />
          </Link>
          <Link
            ref={setRef(3)}
            href="/explore"
            className="relative z-10 transition-colors"
            style={{ color: pathname === "/explore" ? c.text : c.text }}
          >
            <Compass size={26} strokeWidth={1.6} />
          </Link>
          {loading ? (
            <div className="w-6 h-6 relative z-10" />
          ) : username ? (
            <Link
              ref={setRef(4)}
              href={profilePath}
              className="relative z-10 transition-colors"
              style={{ color: pathname === profilePath ? c.text : c.text }}
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
              className="relative z-10 transition-colors"
              style={{ color: pathname === "/login" ? c.text : c.text }}
            >
              <UserIcon size={26} strokeWidth={1.6} />
            </Link>
          )}
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside
        style={{
          background: c.bg,
          borderRight: `0px solid ${c.border}`,
        }}
        className="hidden md:flex fixed top-0 left-0 h-screen z-40 flex-col py-8"
      >
        <div className="group/sidebar flex flex-col h-full w-20 hover:w-60 transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden">
          <div className="px-6 mb-10" />
          <div className="flex flex-col gap-2 px-3">
            <NavItem
              href="/feed"
              label="Home"
              active={pathname === "/feed"}
              c={c}
            >
              <Home size={26} strokeWidth={1.7} />
            </NavItem>

            <NavItem
              href="/search"
              label="Search"
              active={pathname === "/search"}
              c={c}
            >
              <Search size={26} strokeWidth={1.7} />
            </NavItem>
            <NavItem
              href="/explore"
              label="Explore"
              active={pathname === "/explore"}
              c={c}
            >
              <Compass size={26} strokeWidth={1.7} />
            </NavItem>

            <NavItem
              href="/upload"
              label="Create"
              active={pathname === "/upload"}
              c={c}
            >
              <Upload size={26} strokeWidth={1.7} />
            </NavItem>
            {loading ? (
              <div className="w-6 h-6 ml-3" />
            ) : username ? (
              <NavItem
                href={`/profile/${username}`}
                label="Profile"
                active={pathname === `/profile/${username}`}
                c={c}
              >
                <UserIcon size={26} strokeWidth={1.7} />
              </NavItem>
            ) : (
              <NavItem
                href="/login"
                label="Login"
                active={pathname === "/login"}
                c={c}
              >
                <UserIcon size={26} strokeWidth={1.7} />
              </NavItem>
            )}
          </div>
          <div className="flex-1" />
          <div className="flex flex-col gap-2 px-3">
            {isOwnProfile && (
              <button
                onClick={() => router.push("/settings")}
                style={{ color: c.textMuted }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = c.text;
                  e.currentTarget.style.background = c.cardMuted;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = c.textMuted;
                  e.currentTarget.style.background = "transparent";
                }}
                className="flex items-center gap-5 px-4 py-3 rounded-xl transition-colors duration-200 w-full"
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
                style={{ color: c.textMuted }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = c.text;
                  e.currentTarget.style.background = c.cardMuted;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = c.textMuted;
                  e.currentTarget.style.background = "transparent";
                }}
                className="flex items-center gap-5 px-4 py-3 rounded-lg transition-colors duration-200 w-full"
              >
                <div className="min-w-7 flex justify-center">
                  <LogOut size={26} strokeWidth={1.7} />
                </div>
                <span className="opacity-0 -translate-x-3 group-hover/sidebar:opacity-100 group-hover/sidebar:translate-x-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] delay-75 text-[15px] font-medium tracking-tight whitespace-nowrap">
                  Log out
                </span>
              </button>
            ) : (
              <NavItem
                href="/login"
                label="Log in"
                active={pathname === "/login"}
                c={c}
              >
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
  href,
  label,
  active,
  children,
  c,
}: {
  href: string;
  label: string;
  active: boolean;
  children: React.ReactNode;
  c: (typeof THEME_COLORS)[keyof typeof THEME_COLORS];
}) {
  return (
    <Link
      href={href}
      style={{
        color: active ? c.text : c.textMuted,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = c.text;
        e.currentTarget.style.background = c.cardMuted;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = active ? c.text : c.textMuted;
        e.currentTarget.style.background = "transparent";
      }}
      className="flex items-center gap-5 px-4 py-3 rounded-xl transition-colors duration-200"
    >
      <div className="min-w-7 flex justify-center">{children}</div>
      <span className="opacity-0 -translate-x-3 group-hover/sidebar:opacity-100 group-hover/sidebar:translate-x-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] delay-75 text-[15px] font-medium tracking-tight whitespace-nowrap">
        {label}
      </span>
    </Link>
  );
}