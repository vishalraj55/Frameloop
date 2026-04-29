"use client";

import { useMemo, useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  Settings,
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  X,
} from "lucide-react";
import Image from "next/image";

type Params = { username?: string };

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

function NotifBadge({ type }: { type: Notification["type"] }) {
  const bg = notifAccent(type);
  if (type === "like")
    return (
      <span
        className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
        style={{ background: bg, border: "2px solid #141414" }}
      >
        <Heart size={8} fill="white" className="text-white" />
      </span>
    );
  if (type === "comment")
    return (
      <span
        className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
        style={{ background: bg, border: "2px solid #141414" }}
      >
        <MessageCircle size={8} fill="white" className="text-white" />
      </span>
    );
  return (
    <span
      className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
      style={{ background: bg, border: "2px solid #141414" }}
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
}: {
  notifications: Notification[];
  maxHeight: string;
  onClose: () => void;
  onNavigate: (url: string) => void;
}) {
  return (
    <div className="overflow-y-auto space-y-2 p-2" style={{ maxHeight }}>
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "#1f1f1f" }}
          >
            <Bell size={20} className="text-neutral-500" />
          </div>
          <div className="text-center">
            <p className="text-neutral-400 text-[13px] font-medium">
              All caught up
            </p>
            <p className="text-neutral-600 text-[12px] mt-0.5">
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
              background: !n.read ? "rgba(255,255,255,0.03)" : "transparent",
              borderBottom:
                i < notifications.length - 5
                  ? "1px solid rgba(255,255,255,0.06)"
                  : "none",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.05)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = !n.read
                ? "rgba(255,255,255,0.03)"
                : "transparent")
            }
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-white text-sm font-semibold"
                style={{ background: "#2a2a2a" }}
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
              <NotifBadge type={n.type} />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] leading-snug">
                <span className="font-semibold text-white">
                  {n.sender.username}
                </span>{" "}
                <span className="text-neutral-400">{notifText(n.type)}</span>
              </p>
              {n.type === "comment" && n.comment?.text && (
                <p className="text-[12px] text-neutral-600 mt-0.5 truncate">
                  &quot;{n.comment.text}&quot;
                </p>
              )}
              <p className="text-[11px] mt-1 text-neutral-600">
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

export default function TopBar() {
  const { data } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { username } = useParams<Params>();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const unread = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!data?.user) return;
    const load = async () => {
      try {
        const res = await fetch("/api/notifications", {
          headers: { Authorization: `Bearer ${data.user.token}` },
        });
        if (res.ok) setNotifications(await res.json());
      } catch {}
    };
    void load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [data?.user]);

  const handleBell = async () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${data?.user?.token}` },
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
    () => isProfile && data?.user?.username === username,
    [isProfile, data?.user?.username, username],
  );

  const title = useMemo(() => {
    if (!isProfile) return "Frameloop";
    if (pathname?.includes("/followers")) return `${username}'s followers`;
    if (pathname?.includes("/following")) return `${username}'s following`;
    return username;
  }, [isProfile, pathname, username]);

  const font = useMemo(
    () =>
      isProfile
        ? "system-ui,-apple-system,sans-serif"
        : '"Billabong",cursive,"Segoe Script","Apple Chancery"',
    [isProfile],
  );

  const handleSignOut = useCallback(
    () => signOut({ callbackUrl: "/login" }),
    [],
  );
  const handleClose = useCallback(() => setOpen(false), []);
  const handleNavigate = useCallback(
    (url: string) => router.push(url),
    [router],
  );
  if (isFollowPage) return null;

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
            {data && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => void handleBell()}
                  className="relative p-2 rounded-full hover:bg-[#1a1a1a] transition"
                  aria-label="Notifications"
                >
                  <Bell size={22} strokeWidth={1.8} className="text-white" />
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
                      background: "#141414",
                      border: "1px solid rgba(255,255,255,0.08)",
                      boxShadow:
                        "0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)",
                    }}
                  >
                    <div className="flex items-center justify-between px-4 py-3"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <span className="text-white font-semibold text-[15px]">
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
                    />

                    {/*Footer*/}
                    <div
                      className="py-3 text-center"
                      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
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
                {/* <LogOut size={22} strokeWidth={1.8} className="text-white" /> */}
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

      {/*mobile full-screen sheet*/}
      {open && isMobile && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0e0e0e]">
          <div
            className="flex items-center justify-between px-5 pt-14 pb-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span className="text-white font-semibold text-[17px]">
              Notifications
            </span>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-white/5 transition"
            >
              <X size={20} className="text-neutral-500" />
            </button>
          </div>
          <NotificationList
            notifications={notifications}
            maxHeight="calc(100vh - 120px)"
            onClose={handleClose}
            onNavigate={handleNavigate}
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