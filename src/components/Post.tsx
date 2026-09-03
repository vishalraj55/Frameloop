"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme, THEME_COLORS } from "@/context/ThemeContext";
import { useRouter } from "next/navigation";
import CommentSheet from "./CommentSheet";
import {
  Heart,
  MessageCircle,
  Bookmark,
  MoreHorizontal,
  Send,
  Link as LinkIcon,
  Check,
  X,
} from "lucide-react";

type ThemeColors = (typeof THEME_COLORS)[keyof typeof THEME_COLORS];

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return `${weeks}w ago`;
}

type PostProps = {
  id: string;
  authorId: string;
  username: string;
  avatar: string | null;
  imageUrl: string;
  caption?: string;
  likes: number;
  isLiked?: boolean;
  createdAt: string;
  priority?: boolean;
  isFollowing?: boolean;
  onDelete?: (id: string) => void;
};

type ToastType = "success" | "error" | null;

function Toast({
  message,
  type,
  c,
}: {
  message: string;
  type: ToastType;
  c: ThemeColors;
}) {
  if (!type) return null;
  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-999 flex items-center gap-2 px-4 py-2.5 rounded-2xl border shadow-xl"
      style={{ background: c.card, borderColor: c.border }}
    >
      {type === "success" ? (
        <Check size={15} className="text-[#0095f6]" />
      ) : (
        <X size={15} className="text-[#ed4956]" />
      )}
      <span className="text-[13px] font-medium" style={{ color: c.text }}>
        {message}
      </span>
    </div>
  );
}

function HeartBurst({ show }: { show: boolean }) {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-300 ${
        show ? "opacity-100 scale-100" : "opacity-0 scale-50"
      }`}
    >
      <Heart
        size={90}
        fill="#ed4956"
        className="text-[#ed4956] drop-shadow-lg"
      />
    </div>
  );
}

function MenuItem({
  label,
  danger,
  onClick,
  last,
  c,
}: {
  label: string;
  danger?: boolean;
  onClick: () => void;
  last?: boolean;
  c: ThemeColors;
}) {
  return (
    <>
      <button
        onClick={onClick}
        className="w-full py-4.5 text-center transition-colors"
        style={{ background: "transparent" }}
      >
        <span
          className={`text-[17px] ${danger ? "text-[#ed4956] font-semibold" : ""}`}
          style={!danger ? { color: last ? c.textMuted : c.text } : undefined}
        >
          {label}
        </span>
      </button>
      {!last && <div className="h-px" style={{ background: c.border }} />}
    </>
  );
}

function Sheet({
  children,
  onClose,
  c,
}: {
  children: React.ReactNode;
  onClose: () => void;
  c: ThemeColors;
}) {
  return (
    <div
      className="fixed inset-0 z-100 flex flex-col justify-end"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={onClose}
    >
      <div
        className="rounded-t-2xl overflow-hidden"
        style={{ background: c.card }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-10 h-1 rounded-full mx-auto mt-3 mb-3"
          style={{ background: c.border }}
        />
        {children}
        <div className="h-8" />
      </div>
    </div>
  );
}

function ConfirmSheet({
  title,
  body,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
  c,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  c: ThemeColors;
}) {
  return (
    <Sheet onClose={onCancel} c={c}>
      <div
        className="px-4 py-4 text-center border-b"
        style={{ borderColor: c.border }}
      >
        <p className="text-[17px] font-semibold" style={{ color: c.text }}>
          {title}
        </p>
        <p className="text-[13px] mt-1" style={{ color: c.textMuted }}>
          {body}
        </p>
      </div>
      <button
        onClick={onConfirm}
        className={`w-full py-4 text-[15px] font-semibold border-b ${
          danger ? "text-[#ed4956]" : "text-[#0095f6]"
        }`}
        style={{ borderColor: c.border }}
      >
        {confirmLabel}
      </button>
      <button
        onClick={onCancel}
        className="w-full py-4 text-[15px]"
        style={{ color: c.text }}
      >
        Cancel
      </button>
    </Sheet>
  );
}

function ShareSheet({
  postId,
  username,
  onClose,
  c,
}: {
  postId: string;
  username: string;
  onClose: () => void;
  c: ThemeColors;
}) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    const url = `${window.location.origin}/p/${postId}`;
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(onClose, 1200);
    });
  }

  return (
    <Sheet onClose={onClose} c={c}>
      <p
        className="text-center text-[17px] font-semibold pt-4 pb-3"
        style={{ color: c.text }}
      >
        Share
      </p>
      <div className="h-px" style={{ background: c.border }} />
      <button
        onClick={copyLink}
        className="w-full flex items-center gap-4 px-5 py-4"
      >
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center"
          style={{ background: c.cardMuted }}
        >
          {copied ? (
            <Check size={20} className="text-[#0095f6]" />
          ) : (
            <LinkIcon size={20} style={{ color: c.text }} />
          )}
        </div>
        <span className="text-[15px]" style={{ color: c.text }}>
          {copied ? "Link copied!" : "Copy link"}
        </span>
      </button>
      {typeof navigator !== "undefined" && "share" in navigator && (
        <button
          onClick={() => {
            void navigator.share({
              title: `${username}'s post`,
              url: `${window.location.origin}/p/${postId}`,
            });
          }}
          className="w-full flex items-center gap-4 px-5 py-4 border-t"
          style={{ borderColor: c.border }}
        >
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: c.cardMuted }}
          >
            <Send size={20} style={{ color: c.text }} />
          </div>
          <span className="text-[15px]" style={{ color: c.text }}>
            Share via…
          </span>
        </button>
      )}
      <div className="h-px" style={{ background: c.border }} />
      <button
        onClick={onClose}
        className="w-full py-4 text-[15px] font-semibold"
        style={{ color: c.text }}
      >
        Cancel
      </button>
    </Sheet>
  );
}

function getStored(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]") as string[];
  } catch {
    return [];
  }
}
function setStored(key: string, val: string[]) {
  localStorage.setItem(key, JSON.stringify(val));
}

export default function Post({
  id,
  username,
  avatar,
  imageUrl,
  caption,
  likes,
  isLiked: initialIsLiked = false,
  createdAt,
  priority = false,
  isFollowing: initialIsFollowing = false,
  onDelete,
}: PostProps) {
  const { user, username: currentUsername, loading: authLoading } = useAuth();
  const { resolvedTheme } = useTheme();
  const c = THEME_COLORS[resolvedTheme];
  const router = useRouter();
  const lastTapRef = useRef(0);
  const isOwner = currentUsername === username;

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes ?? 0);
  const [likeLoading, setLikeLoading] = useState(false);

  const [saved, setSaved] = useState(() =>
    getStored("savedPosts").includes(id),
  );
  const [hidden, setHidden] = useState(() =>
    getStored("hiddenPosts").includes(id),
  );
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  useEffect(() => {
    if (authLoading) return;
    setLiked(initialIsLiked);
    setFollowing(initialIsFollowing);
  }, [authLoading, initialIsLiked, initialIsFollowing]);
  const [heartBurst, setHeartBurst] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmUnfollow, setConfirmUnfollow] = useState(false);
  const [confirmReport, setConfirmReport] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: ToastType }>({
    msg: "",
    type: null,
  });

  function showToast(msg: string, type: ToastType) {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: null }), 2500);
  }

  async function toggleLike() {
    if (likeLoading) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((p) => (wasLiked ? p - 1 : p + 1));
    setLikeLoading(true);
    try {
      const token = user ? await user.getIdToken() : null;
      const res = await fetch(`/api/posts/${id}/like`, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { liked: boolean; count: number };
      setLiked(data.liked);
      setLikeCount(data.count);
    } catch {
      setLiked(wasLiked);
      setLikeCount((p) => (wasLiked ? p + 1 : p - 1));
      showToast("Failed to like. Try again.", "error");
    } finally {
      setLikeLoading(false);
    }
  }

  async function toggleFollow() {
    if (!user?.uid || followLoading) return;
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    setFollowLoading(true);
    try {
      const res = await fetch(`/api/users/${username}/follow`, {
        method: wasFollowing ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({ followerId: user.uid }),
      });
      if (!res.ok) throw new Error();
      showToast(
        wasFollowing ? `Unfollowed @${username}` : `Following @${username}`,
        "success",
      );
    } catch {
      setFollowing(wasFollowing);
      showToast("Something went wrong. Try again.", "error");
    } finally {
      setFollowLoading(false);
    }
  }

  async function doUnfollow() {
    setConfirmUnfollow(false);
    setMenuOpen(false);
    await toggleFollow();
  }

  function toggleSave() {
    const arr = getStored("savedPosts");
    const isSaved = arr.includes(id);
    setStored(
      "savedPosts",
      isSaved ? arr.filter((x) => x !== id) : [...arr, id],
    );
    setSaved(!isSaved);
    showToast(
      isSaved ? "Removed from saved" : "Saved to collection",
      "success",
    );
  }

  function handleDoubleTap() {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!liked) {
        void toggleLike();
        setHeartBurst(true);
        setTimeout(() => setHeartBurst(false), 800);
      }
    }
    lastTapRef.current = now;
  }

  function hidePost() {
    const arr = getStored("hiddenPosts");
    setStored("hiddenPosts", [...arr, id]);
    setHidden(true);
    setMenuOpen(false);
    showToast("Post hidden", "success");
  }

  async function doDelete() {
    try {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (res.ok) {
        onDelete?.(id);
        showToast("Post deleted", "success");
      } else {
        showToast("Failed to delete post", "error");
      }
    } catch {
      showToast("Failed to delete post", "error");
    }
    setConfirmDelete(false);
    setMenuOpen(false);
  }

  function doReport() {
    setReportDone(true);
    setTimeout(() => {
      setReportDone(false);
      setConfirmReport(false);
      setMenuOpen(false);
      showToast("Report submitted. Thanks for your feedback.", "success");
    }, 1200);
  }

  if (hidden) {
    return (
      <article
        className="border-b px-4 py-5 flex items-center justify-between"
        style={{ borderColor: c.border }}
      >
        <p className="text-[14px]" style={{ color: c.textMuted }}>
          Post hidden
        </p>
        <button
          onClick={() => {
            const arr = getStored("hiddenPosts").filter((x) => x !== id);
            setStored("hiddenPosts", arr);
            setHidden(false);
          }}
          className="text-[14px] text-[#0095f6] font-semibold"
        >
          Undo
        </button>
      </article>
    );
  }

  return (
    <>
      <Toast message={toast.msg} type={toast.type} c={c} />

      <article>
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <Link href={`/profile/${username}`}>
              {avatar ? (
                <Image
                  src={avatar}
                  alt={username}
                  width={34}
                  height={34}
                  className="rounded-full border object-cover"
                  style={{ borderColor: c.border }}
                />
              ) : (
                <div
                  className="w-8.5 h-8.5 rounded-full flex items-center justify-center text-sm font-semibold"
                  style={{ background: c.cardMuted, color: c.text }}
                >
                  {username[0]?.toUpperCase()}
                </div>
              )}
            </Link>
            <div className="flex flex-col">
              <Link
                href={`/profile/${username}`}
                className="text-lg font-semibold leading-tight"
                style={{ color: c.text }}
              >
                {username}
              </Link>
              <span
                className="text-[12px] tracking-wide leading-tight"
                style={{ color: c.textMuted }}
              >
                {getRelativeTime(createdAt)}
              </span>
            </div>
          </div>
          <button
            onClick={() => setMenuOpen(true)}
            className="p-1.5 -mr-1 active:opacity-60"
          >
            <MoreHorizontal size={20} style={{ color: c.text }} />
          </button>
        </div>

        {/*  Image  */}
        <div className="relative" onClick={handleDoubleTap}>
          <Image
            src={imageUrl}
            alt=""
            width={640}
            height={640}
            className="w-full block rounded-md"
            priority={priority}
            loading={priority ? "eager" : "lazy"}
          />
          <HeartBurst show={heartBurst} />
        </div>

        {/* Action bar  */}
        <div className="flex items-center px-3 py-2 gap-4">
          <button
            onClick={() => void toggleLike()}
            disabled={likeLoading}
            className={`active:scale-90 transition-transform ${likeLoading ? "opacity-60" : ""}`}
          >
            <Heart
              size={26}
              className={liked ? "text-[#ed4956]" : ""}
              style={!liked ? { color: c.text } : undefined}
              fill={liked ? "#ed4956" : "none"}
            />
          </button>
          <button
            onClick={() => setCommentOpen(true)}
            className="active:scale-90 transition-transform"
          >
            <MessageCircle size={26} style={{ color: c.text }} />
          </button>
          <button
            onClick={() => setShareOpen(true)}
            className="active:scale-90 transition-transform"
          >
            <Send size={24} style={{ color: c.text }} />
          </button>
          <div className="flex-1" />
          <button
            onClick={toggleSave}
            disabled
            className="active:scale-90 transition-transform opacity-50 cursor-not-allowed"
          >
            {" "}
            {/*This is dissabled for now cos i am working on it*/}
            <Bookmark
              size={26}
              style={{ color: c.text }}
              fill={saved ? c.text : "none"}
            />
          </button>
        </div>

        {/* Likes  */}
        <div className="px-3 text-md font-semibold" style={{ color: c.text }}>
          {(likeCount ?? 0).toLocaleString()} like
        </div>

        {/* Caption */}
        {caption && (
          <div
            className="px-3 py-1 text-[15px] leading-snug tracking-tight"
            style={{ color: c.text, fontFamily: "'Outfit', sans-serif" }}
          >
            <Link
              href={`/profile/${username}`}
              className="font-semibold mr-2"
              style={{ color: c.text }}
            >
              {username}
            </Link>
            <span style={{ color: c.textMuted }}>{caption}</span>
          </div>
        )}

        <CommentSheet
          postId={id}
          open={commentOpen}
          onClose={() => setCommentOpen(false)}
        />
      </article>

      {/* Three-dot menu */}
      {menuOpen && (
        <Sheet onClose={() => setMenuOpen(false)} c={c}>
          {isOwner ? (
            <>
              <MenuItem
                label="Delete"
                danger
                c={c}
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmDelete(true);
                }}
              />
              <MenuItem
                label="Edit"
                c={c}
                onClick={() => {
                  setMenuOpen(false);
                  router.push(`/p/${id}/edit`);
                }}
              />
              <MenuItem
                label={saved ? "Remove from saved" : "Add to favourites"}
                c={c}
                onClick={() => {
                  setMenuOpen(false);
                  toggleSave();
                }}
              />
              <MenuItem
                label="Go to post"
                c={c}
                onClick={() => {
                  setMenuOpen(false);
                  router.push(`/p/${id}`);
                }}
              />
              <MenuItem
                label="Share to…"
                c={c}
                onClick={() => {
                  setMenuOpen(false);
                  setShareOpen(true);
                }}
              />
              <MenuItem
                label="Copy link"
                c={c}
                onClick={() => {
                  void navigator.clipboard.writeText(
                    `${window.location.origin}/p/${id}`,
                  );
                  setMenuOpen(false);
                  showToast("Link copied", "success");
                }}
              />
              <MenuItem
                label="Cancel"
                c={c}
                onClick={() => setMenuOpen(false)}
                last
              />
            </>
          ) : (
            <>
              <MenuItem
                label="Report"
                danger
                c={c}
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmReport(true);
                }}
              />
              {following && (
                <MenuItem
                  label={`Unfollow @${username}`}
                  danger
                  c={c}
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmUnfollow(true);
                  }}
                />
              )}
              {!following && (
                <MenuItem
                  label={`Follow @${username}`}
                  c={c}
                  onClick={() => {
                    setMenuOpen(false);
                    void toggleFollow();
                  }}
                />
              )}
              <MenuItem
                label={saved ? "Remove from saved" : "Add to favourites"}
                c={c}
                onClick={() => {
                  setMenuOpen(false);
                  toggleSave();
                }}
              />
              <MenuItem
                label="Go to post"
                c={c}
                onClick={() => {
                  setMenuOpen(false);
                  router.push(`/p/${id}`);
                }}
              />
              <MenuItem
                label="Share to…"
                c={c}
                onClick={() => {
                  setMenuOpen(false);
                  setShareOpen(true);
                }}
              />
              <MenuItem
                label="Copy link"
                c={c}
                onClick={() => {
                  void navigator.clipboard.writeText(
                    `${window.location.origin}/p/${id}`,
                  );
                  setMenuOpen(false);
                  showToast("Link copied", "success");
                }}
              />
              <MenuItem label="Hide" c={c} onClick={hidePost} />
              <MenuItem
                label="About this account"
                c={c}
                onClick={() => {
                  setMenuOpen(false);
                  router.push(`/profile/${username}`);
                }}
              />
              <MenuItem
                label="Cancel"
                c={c}
                onClick={() => setMenuOpen(false)}
                last
              />
            </>
          )}
        </Sheet>
      )}

      {confirmDelete && (
        <ConfirmSheet
          title="Delete post?"
          body="This will permanently remove your post. You can't undo this."
          confirmLabel="Delete"
          danger
          onConfirm={() => void doDelete()}
          onCancel={() => setConfirmDelete(false)}
          c={c}
        />
      )}

      {confirmUnfollow && (
        <ConfirmSheet
          title={`Unfollow @${username}?`}
          body="Their posts will no longer appear in your feed."
          confirmLabel="Unfollow"
          danger
          onConfirm={() => void doUnfollow()}
          onCancel={() => setConfirmUnfollow(false)}
          c={c}
        />
      )}

      {confirmReport && (
        <Sheet onClose={() => setConfirmReport(false)} c={c}>
          <p
            className="text-center text-[17px] font-semibold pt-4 pb-1"
            style={{ color: c.text }}
          >
            Report post
          </p>
          <p
            className="text-center text-[13px] pb-4 px-6"
            style={{ color: c.textMuted }}
          >
            Why are you reporting this post?
          </p>
          <div className="h-px" style={{ background: c.border }} />
          {[
            "It's spam",
            "Nudity or sexual activity",
            "Hate speech or symbols",
            "Violence or dangerous organizations",
            "Selling illegal or regulated goods",
            "Bullying or harassment",
            "Intellectual property violation",
            "Suicide or self-injury",
            "Eating disorders",
            "Something else",
          ].map((reason) => (
            <button
              key={reason}
              onClick={doReport}
              disabled={reportDone}
              className="w-full px-5 py-3.5 text-left text-[15px] border-b disabled:opacity-60 flex items-center justify-between"
              style={{ color: c.text, borderColor: c.border }}
            >
              <span>{reason}</span>
              {reportDone && <Check size={16} className="text-[#0095f6]" />}
            </button>
          ))}
          <button
            onClick={() => setConfirmReport(false)}
            className="w-full py-4 text-[15px]"
            style={{ color: c.text }}
          >
            Cancel
          </button>
        </Sheet>
      )}

      {shareOpen && (
        <ShareSheet
          postId={id}
          username={username}
          onClose={() => setShareOpen(false)}
          c={c}
        />
      )}
    </>
  );
}