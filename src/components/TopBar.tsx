"use client";

import { useMemo, useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Bolt, Bell, Heart, MessageCircle, UserPlus, X } from "lucide-react";
import Image from "next/image";
import { auth } from "@/lib/firebase";
import { useTheme, THEME_COLORS } from "@/context/ThemeContext";

type Params = { username?: string };
type ThemeColors = (typeof THEME_COLORS)[keyof typeof THEME_COLORS];

interface Notification {
  id: string;
  type: "like" | "comment" | "follow";
  read: boolean;
  createdAt: string;
  sender: { username: string; avatarUrl: string | null };
  postId?: string;
  comment?: { text: string };
}

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function notifAccent(type: Notification["type"]) {
  if (type === "like") return "#f43f5e";
  if (type === "comment") return "#3b82f6";
  return "#a855f7";
}

function notifText(type: Notification["type"]) {
  if (type === "like") return "liked your post";
  if (type === "comment") return "commented on your post";
  return "started following you";
}

function NotifBadge({
  type,
  c,
}: {
  type: Notification["type"];
  c: ThemeColors;
}) {
  const bg = notifAccent(type);
  if (type === "like")
    return (
      <span
        className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
        style={{ background: bg, border: `2px solid ${c.card}` }}
      >
        <Heart size={8} fill="white" className="text-white" />
      </span>
    );
  if (type === "comment")
    return (
      <span
        className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
        style={{ background: bg, border: `2px solid ${c.card}` }}
      >
        <MessageCircle size={8} fill="white" className="text-white" />
      </span>
    );
  return (
    <span
      className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
      style={{ background: bg, border: `2px solid ${c.card}` }}
    >
      <UserPlus size={8} className="text-white" />
    </span>
  );
}

function NotificationList({
  notifications,
  maxHeight,
  onClose,
  onNavigate,
  c,
}: {
  notifications: Notification[];
  maxHeight: string;
  onClose: () => void;
  onNavigate: (url: string) => void;
  c: ThemeColors;
}) {
  const isDark = c.bg === THEME_COLORS.dark.bg;
  const rowHoverBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const rowUnreadBg = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.025)";
  const rowBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

  return (
    <div className="overflow-y-auto space-y-2 p-2" style={{ maxHeight }}>
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: c.cardMuted }}
          >
            <Bell size={20} style={{ color: c.textMuted }} />
          </div>
          <div className="text-center">
            <p
              className="text-[13px] font-medium"
              style={{ color: c.textMuted }}
            >
              All caught up
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: c.textFaint }}>
              No new notifications
            </p>
          </div>
        </div>
      ) : (
        notifications.map((n, i) => (
          <button
            key={n.id}
            onClick={() => {
              onClose();
              if (n.postId) onNavigate(`/post/${n.postId}`);
              else onNavigate(`/profile/${n.sender.username}`);
            }}
            className="w-full text-left flex items-start gap-5 px-4 py-3 rounded-lg transition-colors"
            style={{
              background: !n.read ? rowUnreadBg : "transparent",
              borderBottom:
                i < notifications.length - 5
                  ? `1px solid ${rowBorder}`
                  : "none",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = rowHoverBg)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = !n.read
                ? rowUnreadBg
                : "transparent")
            }
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-sm font-semibold"
                style={{ background: c.cardMuted, color: c.text }}
              >
                {n.sender.avatarUrl ? (
                  <Image
                    src={n.sender.avatarUrl}
                    alt={n.sender.username}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  n.sender.username[0]?.toUpperCase()
                )}
              </div>
              <NotifBadge type={n.type} c={c} />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] leading-snug">
                <span className="font-semibold" style={{ color: c.text }}>
                  {n.sender.username}
                </span>{" "}
                <span style={{ color: c.textMuted }}>{notifText(n.type)}</span>
              </p>
              {n.type === "comment" && n.comment?.text && (
                <p
                  className="text-[12px] mt-0.5 truncate"
                  style={{ color: c.textFaint }}
                >
                  &quot;{n.comment.text}&quot;
                </p>
              )}
              <p className="text-[11px] mt-1" style={{ color: c.textFaint }}>
                {timeAgo(n.createdAt)}
              </p>
            </div>

            {!n.read && (
              <div className="w-2 h-2 rounded-full shrink-0 bg-blue-500" />
            )}
          </button>
        ))
      )}
    </div>
  );
}

function FrameloopsLogo({
  c,
  className,
}: {
  c: ThemeColors;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 450 400"
      className={className}
      aria-label="Frameloops"
      role="img"
    >
      <path
        d="M50 249
        C53 218 58 184 73 160
        C83 145 94 135 105 130
        C109 128 111 130 114 136
        L123 151
        C126 156 130 158 133 156
        C136 154 137 149 138 142
        L144 103
        C147 84 152 70 158 67
        C166 63 172 69 178 79
        L185 91
        C191 101 197 103 208 101
        C224 98 239 98 255 101
        C266 103 271 99 277 89
        L285 76
        C291 66 298 63 304 69
        C312 78 316 95 319 113
        L324 151
        C325 159 330 161 334 156
        L343 134
        C345 129 348 128 352 132
        C376 153 391 180 397 210
        C400 224 402 239 402 249
        C403 258 399 263 391 264
        C379 264 369 258 358 258
        C344 259 335 267 329 279
        C325 288 323 296 321 301
        C320 305 317 305 312 304
        L289 297
        C276 294 265 296 255 302
        C246 307 239 318 231 324
        C220 332 210 330 199 323
        C190 317 183 307 172 302
        C160 296 148 296 136 300
        L130 302
        C124 304 119 300 117 294
        L112 278
        C107 265 96 257 83 256
        C71 255 61 261 54 258
        C48 256 47 253 50 249Z"
        fill="none"
        stroke={c.text}
        strokeWidth={13}
        strokeLinejoin="round"
      />
      <path
        d="M192 130 L210 138"
        stroke={c.text}
        strokeWidth={14}
        strokeLinecap="round"
      />
      <path
        d="M239 140 L258 131"
        stroke={c.text}
        strokeWidth={14}
        strokeLinecap="round"
      />
      <ellipse
        cx={178}
        cy={182}
        rx={37}
        ry={36}
        fill={c.bg}
        stroke={c.text}
        strokeWidth={11}
      />
      <circle cx={193} cy={182} r={12} fill={c.text} />
      <circle cx={198} cy={176} r={5} fill={c.bg} />
      <ellipse
        cx={268}
        cy={182}
        rx={37}
        ry={36}
        fill={c.bg}
        stroke={c.text}
        strokeWidth={11}
      />
      <circle cx={283} cy={182} r={12} fill={c.text} />
      <circle cx={288} cy={176} r={5} fill={c.bg} />
    </svg>
  );
}

export default function TopBar() {
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { username } = useParams<Params>();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const c = THEME_COLORS[resolvedTheme];
  const isDark = resolvedTheme === "dark";

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [myUsername, setMyUsername] = useState<string | null>(null);

  const unread = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const isHome = useMemo(
    () => pathname === "/" || pathname === "/feed",
    [pathname],
  );

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setMyUsername(currentUser?.displayName ?? null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const token = await user.getIdToken();
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as Notification[];
        setNotifications(data);
      }
    };
    void load();
  }, [user]);

  const handleBell = async () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${await user?.getIdToken()}` },
      });
      setNotifications((p) => p.map((n) => ({ ...n, read: true })));
    }
  };

  const isFollowPage = useMemo(
    () => pathname?.includes("/followers") || pathname?.includes("/following"),
    [pathname],
  );

  const isProfile = useMemo(
    () =>
      (pathname?.startsWith("/profile/") || pathname?.startsWith("/users/")) &&
      !!username,
    [pathname, username],
  );

  const isOwnProfile = useMemo(
    () => isProfile && myUsername === username,
    [isProfile, myUsername, username],
  );

  const title = useMemo(() => {
    if (!isProfile) return "Frameloops";
    if (pathname?.includes("/followers")) return `${username}'s followers`;
    if (pathname?.includes("/following")) return `${username}'s following`;
    return username;
  }, [isProfile, pathname, username]);

  const font = useMemo(
    () =>
      isProfile ? "system-ui,-apple-system,sans-serif" : "'Agbalumo', cursive",
    [isProfile],
  );

  const isBrandTitle = !isProfile;

  const handleSignOut = useCallback(async () => {
    await signOut(auth);
    router.push("/login");
  }, [router]);
  const handleClose = useCallback(() => setOpen(false), []);
  const handleNavigate = useCallback(
    (url: string) => router.push(url),
    [router],
  );
  if (isFollowPage) return null;

  const hoverBg = isDark ? "#1a1a1a" : "#ececec";
  const dropdownBg = isDark ? "#141414" : "#ffffff";
  const dropdownBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const dropdownShadow = isDark
    ? "0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)"
    : "0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)";
  const hairline = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const sheetBg = isDark ? "#0e0e0e" : "#fafafa";

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 h-14"
        style={{ background: c.bg }}
      >
        <div className="max-w-2xl mx-auto h-full flex items-center justify-between px-4">
          {isBrandTitle ? (
            <>
              <FrameloopsLogo
                c={c}
                className="hidden sm:block h-12 w-auto shrink-0"
              />
              <h1
                className="sm:hidden text-3xl tracking-wide select-none truncate max-w-[80%]"
                style={{ fontFamily: font, color: c.text }}
              >
                {title}
              </h1>
            </>
          ) : (
            <h1
              className="text-3xl tracking-wide select-none truncate max-w-[90%]"
              style={{ color: c.text }}
            >
              {title}
            </h1>
          )}

          <div className="flex items-center gap-1">
            {user && isHome && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => void handleBell()}
                  className="relative p-2 rounded-full transition"
                  style={{ background: "transparent" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = hoverBg)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                  aria-label="Notifications"
                >
                  <Bell size={22} strokeWidth={1.8} style={{ color: c.text }} />
                  {unread > 0 && (
                    <span className="absolute top-1 right-1 min-w-4 h-4 px-0.5 bg-blue-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center leading-none">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </button>

                {/* Desktop dropdown */}
                {open && !isMobile && (
                  <div
                    className="absolute right-0 mt-2 w-90 rounded-2xl z-50 overflow-hidden p-2"
                    style={{
                      background: dropdownBg,
                      border: `1px solid ${dropdownBorder}`,
                      boxShadow: dropdownShadow,
                    }}
                  >
                    <div
                      className="flex items-center justify-between px-4 py-3"
                      style={{ borderBottom: `1px solid ${hairline}` }}
                    >
                      <span
                        className="font-semibold text-[15px]"
                        style={{ color: c.text }}
                      >
                        Notifications
                      </span>
                      {unread > 0 && (
                        <span
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            background: "rgba(59,130,246,0.15)",
                            color: "#60a5fa",
                          }}
                        >
                          {unread} new
                        </span>
                      )}
                    </div>
                    <NotificationList
                      notifications={notifications}
                      maxHeight="400px"
                      onClose={handleClose}
                      onNavigate={handleNavigate}
                      c={c}
                    />

                    {/*Footer*/}
                    <div
                      className="py-3 text-center"
                      style={{ borderTop: `1px solid ${hairline}` }}
                    >
                      <button
                        onClick={() => {
                          handleClose();
                          router.push("/notifications");
                        }}
                        className="text-[13px] font-medium text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isOwnProfile && (
              <button
                onClick={() => router.push("/settings")}
                className="p-2 rounded-full transition"
                style={{ background: "transparent" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = hoverBg)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
                aria-label="Settings"
              >
                <Bolt size={22} strokeWidth={1.8} style={{ color: c.text }} />
              </button>
            )}

            {user ? (
              <button
                onClick={handleSignOut}
                className="p-2 rounded-full transition"
                style={{ background: "transparent" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = hoverBg)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
                aria-label="Sign out"
              ></button>
            ) : (
              <Link
                href="/login"
                className="text-sm font-semibold hover:opacity-80 transition"
                style={{ color: c.text }}
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      </header>

      {/*mobile full-screen sheet*/}
      {open && isMobile && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ background: sheetBg }}
        >
          <div
            className="flex items-center justify-between px-5 pt-14 pb-4"
            style={{ borderBottom: `1px solid ${hairline}` }}
          >
            <span
              className="font-semibold text-[17px]"
              style={{ color: c.text }}
            >
              Notifications
            </span>
            <button
              onClick={handleClose}
              className="p-2 rounded-full transition"
              style={{ background: "transparent" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <X size={20} style={{ color: c.textMuted }} />
            </button>
          </div>
          <NotificationList
            notifications={notifications}
            maxHeight="calc(100vh - 120px)"
            onClose={handleClose}
            onNavigate={handleNavigate}
            c={c}
          />
        </div>
      )}
      {open && !isMobile && (
        <div className="fixed inset-0 z-40" onClick={handleClose} />
      )}

      <div className="h-12 w-full shrink-0" />
    </>
  );
}
