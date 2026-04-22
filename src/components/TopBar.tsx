"use client";

import { useMemo, useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  Settings,
  LogOut,
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

function NotifIcon({ type }: { type: Notification["type"] }) {
  if (type === "like")
    return <Heart size={9} fill="white" className="text-white" />;
  if (type === "comment")
    return <MessageCircle size={9} fill="white" className="text-white" />;
  return <UserPlus size={9} className="text-white" />;
}

function notifAccent(type: Notification["type"]) {
  if (type === "like") return "#f43f5e";
  if (type === "comment") return "#0095f6";
  return "#a855f7";
}

function notifText(type: Notification["type"]) {
  if (type === "like") return "liked your post";
  if (type === "comment") return "commented on your post";
  return "started following you";
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
    <div className="overflow-y-auto" style={{ maxHeight }}>
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-white/5">
            <Bell size={22} className="text-[#444]" />
          </div>
          <div className="text-center">
            <p className="text-[#555] text-[13px]">All caught up</p>
            <p className="text-[#333] text-[11px] mt-0.5">
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
            className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-white/3 active:bg-white/5 transition-colors first:pt-6"
            style={{
              borderBottom:
                i < notifications.length - 1
                  ? "1px solid rgba(255,255,255,0.05)"
                  : "none",
              background: !n.read ? "rgba(0,149,246,0.03)" : undefined,
            }}
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-[#222] flex items-center justify-center">
                {n.sender.avatarUrl ? (
                  <Image
                    src={n.sender.avatarUrl}
                    alt={n.sender.username}
                    width={36}
                    height={36}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-white text-xs font-bold">
                    {n.sender.username[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              <div
                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                style={{
                  background: notifAccent(n.type),
                  border: "1.5px solid #111",
                }}
              >
                <NotifIcon type={n.type} />
              </div>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] leading-snug text-[#ccc]">
                <span className="font-semibold text-white">
                  {n.sender.username}
                </span>{" "}
                <span className="text-[#777]">{notifText(n.type)}</span>
              </p>
              {n.type === "comment" && n.comment?.text && (
                <p className="text-[12px] text-[#555] mt-0.5 truncate">
                  &quot;{n.comment.text}&quot;
                </p>
              )}
              <p className="text-[11px] mt-1 text-[#444]">
                {timeAgo(n.createdAt)}
              </p>
            </div>

            {!n.read && (
              <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#0095f6]" />
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
                    <span className="absolute bottom-0 left-0 min-w-3.75 h-3.75 px-0.5 bg-red-800 rounded-full text-[9px] font-bold text-white flex items-center justify-center leading-none">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </button>

                {/* Desktop dropdown */}
                {open && !isMobile && (
                  <div
                    className="absolute right-0 mt-2 w-85 rounded-xl z-50 overflow-hidden"
                    style={{
                      background: "#111",
                      border: "1px solid rgba(255,255,255,0.07)",
                      boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
                    }}
                  >
                    <div className="flex items-center justify-between px-5 pt-5 pb-3">
                      <span className="text-white font-semibold text-[16px]">
                        Notifications
                      </span>
                      {unread > 0 && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#0095f6]/10 text-[#0095f6]">
                          {unread} new
                        </span>
                      )}
                    </div>
                    <NotificationList
                      notifications={notifications}
                      maxHeight="420px"
                      onClose={handleClose}
                      onNavigate={handleNavigate}
                    />
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

      {/*mobile full-screen sheet*/}
      {open && isMobile && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ background: "#111" }}
        >
          <div className="flex items-center justify-between px-5 pt-14 pb-5 border-b border-white/5">
            <span className="text-white font-semibold text-[17px]">
              Notifications
            </span>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-white/5 transition"
            >
              <X size={20} className="text-[#888]" />
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