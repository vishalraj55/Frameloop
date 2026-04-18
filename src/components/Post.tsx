"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { useSession } from "next-auth/react";
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

function Toast({ message, type }: { message: string; type: ToastType }) {
  if (!type) return null;
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-999 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#1c1c1c] border border-[#333] shadow-xl">
      {type === "success" ? (
        <Check size={15} className="text-[#0095f6]" />
      ) : (
        <X size={15} className="text-[#ed4956]" />
      )}
      <span className="text-white text-[13px] font-medium">{message}</span>
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
      <Heart size={90} fill="#ed4956" className="text-[#ed4956] drop-shadow-lg" />
    </div>
  );
}

function MenuItem({
  label,
  danger,
  onClick,
  last,
}: {
  label: string;
  danger?: boolean;
  onClick: () => void;
  last?: boolean;
}) {
  return (
    <>
      <button
        onClick={onClick}
        className="w-full py-4.5 text-center active:bg-[#2a2a2a] transition-colors"
      >
        <span
          className={`text-[17px] ${
            danger ? "text-[#ed4956] font-semibold" : last ? "text-[#8e8e8e]" : "text-white"
          }`}
        >
          {label}
        </span>
      </button>
      {!last && <div className="h-px bg-[#262626]" />}
    </>
  );
}

function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-100 flex flex-col justify-end"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={onClose}
    >
      <div
        className="bg-[#1c1c1c] rounded-t-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-[#3e3e3e] rounded-full mx-auto mt-3 mb-3" />
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
}: {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Sheet onClose={onCancel}>
      <div className="px-4 py-4 text-center border-b border-[#262626]">
        <p className="text-[17px] font-semibold text-white">{title}</p>
        <p className="text-[13px] text-[#8e8e8e] mt-1">{body}</p>
      </div>
      <button
        onClick={onConfirm}
        className={`w-full py-4 text-[15px] font-semibold border-b border-[#262626] ${
          danger ? "text-[#ed4956]" : "text-[#0095f6]"
        }`}
      >
        {confirmLabel}
      </button>
      <button onClick={onCancel} className="w-full py-4 text-[15px] text-white">
        Cancel
      </button>
    </Sheet>
  );
}

function ShareSheet({
  postId,
  username,
  onClose,
}: {
  postId: string;
  username: string;
  onClose: () => void;
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
    <Sheet onClose={onClose}>
      <p className="text-center text-[17px] font-semibold text-white pt-4 pb-3">Share</p>
      <div className="h-px bg-[#262626]" />
      <button
        onClick={copyLink}
        className="w-full flex items-center gap-4 px-5 py-4 active:bg-[#2a2a2a]"
      >
        <div className="w-11 h-11 rounded-full bg-[#262626] flex items-center justify-center">
          {copied ? (
            <Check size={20} className="text-[#0095f6]" />
          ) : (
            <LinkIcon size={20} className="text-white" />
          )}
        </div>
        <span className="text-[15px] text-white">{copied ? "Link copied!" : "Copy link"}</span>
      </button>
      {typeof navigator !== "undefined" && "share" in navigator && (
        <button
          onClick={() => {
            void navigator.share({
              title: `${username}'s post`,
              url: `${window.location.origin}/p/${postId}`,
            });
          }}
          className="w-full flex items-center gap-4 px-5 py-4 active:bg-[#2a2a2a] border-t border-[#262626]"
        >
          <div className="w-11 h-11 rounded-full bg-[#262626] flex items-center justify-center">
            <Send size={20} className="text-white" />
          </div>
          <span className="text-[15px] text-white">Share via…</span>
        </button>
      )}
      <div className="h-px bg-[#262626]" />
      <button onClick={onClose} className="w-full py-4 text-[15px] text-white font-semibold">
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
  const { data: session } = useSession();
  const router = useRouter();
  const lastTapRef = useRef(0);
  const isOwner = session?.user?.username === username;

  const [liked, setLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(likes ?? 0);
  const [likeLoading, setLikeLoading] = useState(false);

  const [saved, setSaved] = useState(() => getStored("savedPosts").includes(id));
  const [hidden, setHidden] = useState(() => getStored("hiddenPosts").includes(id));
  const [following, setFollowing] = useState(initialIsFollowing);
  const [followLoading, setFollowLoading] = useState(false);
  const [heartBurst, setHeartBurst] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmUnfollow, setConfirmUnfollow] = useState(false);
  const [confirmReport, setConfirmReport] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: ToastType }>({ msg: "", type: null });

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
      const res = await fetch(`/api/posts/${id}/like`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json() as { liked: boolean; count: number };
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
    if (!session?.user?.id || followLoading) return;
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    setFollowLoading(true);
    try {
      const res = await fetch(`/api/users/${username}/follow`, {
        method: wasFollowing ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.user.token}`,
        },
        body: JSON.stringify({ followerId: session.user.id }),
      });
      if (!res.ok) throw new Error();
      showToast(wasFollowing ? `Unfollowed @${username}` : `Following @${username}`, "success");
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
    setStored("savedPosts", isSaved ? arr.filter((x) => x !== id) : [...arr, id]);
    setSaved(!isSaved);
    showToast(isSaved ? "Removed from saved" : "Saved to collection", "success");
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
      <article className="border-b border-zinc-800 px-4 py-5 flex items-center justify-between">
        <p className="text-[14px] text-[#8e8e8e]">Post hidden</p>
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
      <Toast message={toast.msg} type={toast.type} />

      <article className="border-b border-zinc-800">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <Link href={`/profile/${username}`} className="flex items-center gap-2.5">
            {avatar ? (
              <Image
                src={avatar}
                alt={username}
                width={34}
                height={34}
                className="rounded-full border border-zinc-700 object-cover"
              />
            ) : (
              <div className="w-8.5 h-8.5 rounded-full bg-zinc-700 flex items-center justify-center text-white text-sm font-semibold">
                {username[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-sm font-semibold text-white">{username}</span>
          </Link>

          <div className="flex items-center gap-2">
            {!isOwner && session?.user && !following && (
              <button
                onClick={() => void toggleFollow()}
                disabled={followLoading}
                className={`text-[13px] font-semibold text-[#0095f6] transition-opacity ${
                  followLoading ? "opacity-50" : "active:opacity-60"
                }`}
              >
                {followLoading ? "Following..." : "Follow"}
              </button>
            )}
            <button onClick={() => setMenuOpen(true)} className="p-1.5 -mr-1 active:opacity-60">
              <MoreHorizontal size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/*  Image  */}
        <div className="relative" onClick={handleDoubleTap}>
          <Image
            src={imageUrl}
            alt=""
            width={640}
            height={640}
            className="w-full block"
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
              className={`transition-colors ${liked ? "text-[#ed4956]" : "text-white"}`}
              fill={liked ? "#ed4956" : "none"}
            />
          </button>
          <button onClick={() => setCommentOpen(true)} className="active:scale-90 transition-transform">
            <MessageCircle size={26} className="text-white" />
          </button>
          <button onClick={() => setShareOpen(true)} className="active:scale-90 transition-transform">
            <Send size={24} className="text-white" />
          </button>
          <div className="flex-1" />
          <button onClick={toggleSave} className="active:scale-90 transition-transform">
            <Bookmark size={26} className="text-white transition-all" fill={saved ? "white" : "none"} />
          </button>
        </div>

        {/* Likes  */}
        <div className="px-3 text-sm font-semibold text-white">
          {(likeCount ?? 0).toLocaleString()} likes
        </div>

        {/* Caption */}
        {caption && (
          <div className="px-3 py-1 text-sm text-white">
            <span className="font-semibold">{username}</span>{" "}
            <span className="text-zinc-300">{caption}</span>
          </div>
        )}

        {/* Time */}
        <div className="px-3 pb-3 text-[11px] text-zinc-500 tracking-wide mt-1">
          {getRelativeTime(createdAt)}
        </div>

        <CommentSheet postId={id} open={commentOpen} onClose={() => setCommentOpen(false)} />
      </article>

      {/* Three-dot menu */}
      {menuOpen && (
        <Sheet onClose={() => setMenuOpen(false)}>
          {isOwner ? (
            <>
              <MenuItem label="Delete" danger onClick={() => { setMenuOpen(false); setConfirmDelete(true); }} />
              <MenuItem label="Edit" onClick={() => { setMenuOpen(false); router.push(`/p/${id}/edit`); }} />
              <MenuItem label={saved ? "Remove from saved" : "Add to favourites"} onClick={() => { setMenuOpen(false); toggleSave(); }} />
              <MenuItem label="Go to post" onClick={() => { setMenuOpen(false); router.push(`/p/${id}`); }} />
              <MenuItem label="Share to…" onClick={() => { setMenuOpen(false); setShareOpen(true); }} />
              <MenuItem label="Copy link" onClick={() => { void navigator.clipboard.writeText(`${window.location.origin}/p/${id}`); setMenuOpen(false); showToast("Link copied", "success"); }} />
              <MenuItem label="Cancel" onClick={() => setMenuOpen(false)} last />
            </>
          ) : (
            <>
              <MenuItem label="Report" danger onClick={() => { setMenuOpen(false); setConfirmReport(true); }} />
              {following && <MenuItem label={`Unfollow @${username}`} danger onClick={() => { setMenuOpen(false); setConfirmUnfollow(true); }} />}
              {!following && <MenuItem label={`Follow @${username}`} onClick={() => { setMenuOpen(false); void toggleFollow(); }} />}
              <MenuItem label={saved ? "Remove from saved" : "Add to favourites"} onClick={() => { setMenuOpen(false); toggleSave(); }} />
              <MenuItem label="Go to post" onClick={() => { setMenuOpen(false); router.push(`/p/${id}`); }} />
              <MenuItem label="Share to…" onClick={() => { setMenuOpen(false); setShareOpen(true); }} />
              <MenuItem label="Copy link" onClick={() => { void navigator.clipboard.writeText(`${window.location.origin}/p/${id}`); setMenuOpen(false); showToast("Link copied", "success"); }} />
              <MenuItem label="Hide" onClick={hidePost} />
              <MenuItem label="About this account" onClick={() => { setMenuOpen(false); router.push(`/profile/${username}`); }} />
              <MenuItem label="Cancel" onClick={() => setMenuOpen(false)} last />
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
        />
      )}

      {confirmReport && (
        <Sheet onClose={() => setConfirmReport(false)}>
          <p className="text-center text-[17px] font-semibold text-white pt-4 pb-1">Report post</p>
          <p className="text-center text-[13px] text-[#8e8e8e] pb-4 px-6">Why are you reporting this post?</p>
          <div className="h-px bg-[#262626]" />
          {["It's spam","Nudity or sexual activity","Hate speech or symbols","Violence or dangerous organizations","Selling illegal or regulated goods","Bullying or harassment","Intellectual property violation","Suicide or self-injury","Eating disorders","Something else"].map((reason) => (
            <button key={reason} onClick={doReport} disabled={reportDone} className="w-full px-5 py-3.5 text-left text-[15px] text-white border-b border-[#262626] active:bg-[#2a2a2a] disabled:opacity-60 flex items-center justify-between">
              <span>{reason}</span>
              {reportDone && <Check size={16} className="text-[#0095f6]" />}
            </button>
          ))}
          <button onClick={() => setConfirmReport(false)} className="w-full py-4 text-[15px] text-white">Cancel</button>
        </Sheet>
      )}

      {shareOpen && <ShareSheet postId={id} username={username} onClose={() => setShareOpen(false)} />}
    </>
  );
}