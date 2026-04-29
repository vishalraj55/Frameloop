"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Bookmark,
  MoreHorizontal,
  Send,
  Smile,
  ChevronDown,
  ChevronUp,
  Trash2,
  Pencil,
  Flag,
  Check,
} from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Author {
  id: string;
  username: string;
  avatarUrl?: string;
}

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  author: Author;
  likesCount: number;
  likedByMe: boolean;
  isDeleted?: boolean;
  replies?: Comment[];
}

interface PostType {
  id: string;
  imageUrl: string;
  likes: { id: string; userId: string }[];
  likedByMe?: boolean;
  caption?: string;
  author?: Author;
  createdAt?: string;
  savedByMe?: boolean;
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return `${weeks}w`;
}

function Avatar({
  src,
  name,
  size = 32,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
}) {
  return (
    <div
      className="relative rounded-full overflow-hidden shrink-0"
      style={{ width: size, height: size, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",}}
    >
      {src ? (
        <Image src={src} alt="" fill className="object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
          {name?.[0]?.toUpperCase() ?? "?"}
        </div>
      )}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-0.5 sm:gap-0.75">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className={`relative bg-[#111] ${
            i % 7 === 0 
            ? "col-span-2 row-span-2" : ""
          } aspect-square`}
          style={{
            animation: `shimmer 1.5s ease-in-out ${i * 0.1}s infinite`,
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, #111 0%, #1a1a1a 50%, #111 100%)",
              backgroundSize: "200% 100%",
              animation: "shimmerBg 1.5s ease-in-out infinite",
            }}
          />
        </div>
      ))}
      <style>{`
        @keyframes shimmerBg {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}

function PostTile({
  post,
  index,
  onClick,
  onMobileClick,
}: {
  post: PostType;
  index: number;
  onClick: () => void;
  onMobileClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isLarge = index % 7 === 0;

  const handleClick = () => {
    if (window.innerWidth < 768) {
      onMobileClick();
    } else {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`relative block overflow-hidden group ${
        isLarge ? "col-span-2 row-span-2" : ""
      } aspect-square`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transform: hovered ? "scale(0.98)" : "scale(1)",
        transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
    >
      <Image
        src={post.imageUrl}
        alt=""
        fill
        className="object-cover"
        style={{
          transform: hovered ? "scale(1.08)" : "scale(1)",
          transition: "transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
        sizes="(max-width: 768px) 33vw, 300px"
      />
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-3"
        style={{
          background: hovered ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0)",
          opacity: hovered ? 1 : 0,
          transition: "all 0.25s ease",
        }}
      >
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5 text-white font-bold text-sm drop-shadow-lg">
            <Heart className="w-5 h-5 fill-white" />
            {post.likes.length}
          </div>
        </div>
      </div>
      <div
        className="absolute inset-x-0 top-0 h-0.5"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.2s ease",
        }}
      />
    </button>
  );
}

function CommentSection({
  postId,
  userId,
}: {
  postId: string;
  userId: string;
}) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    username: string;
  } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set(),
  );
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/posts/${postId}/comments`);
        const data = (await res.json()) as Comment[];
        setComments(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [postId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handlePost = async () => {
    if (!text.trim() || !userId) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user?.token ?? ""}`,
        },
        body: JSON.stringify({
          authorId: userId,
          text: text.trim(),
          ...(replyingTo && { parentId: replyingTo.id }),
        }),
      });
      const comment = (await res.json()) as Comment;
      if (replyingTo) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyingTo.id
              ? { ...c, replies: [...(c.replies ?? []), comment] }
              : c,
          ),
        );
        setExpandedReplies((prev) => new Set(prev).add(replyingTo.id));
        setReplyingTo(null);
      } else {
        setComments((prev) => [...prev, comment]);
      }
      setText("");
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (commentId: string, parentId?: string) => {
    setMenuOpenId(null);
    try {
      await fetch(`/api/posts/${postId}/comments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, userId }),
      });
      if (parentId) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId
              ? {
                  ...c,
                  replies: (c.replies ?? []).filter((r) => r.id !== commentId),
                }
              : c,
          ),
        );
      } else {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLike = async (commentId: string, parentId?: string) => {
    const update = (c: Comment): Comment =>
      c.id === commentId
        ? {
            ...c,
            likedByMe: !c.likedByMe,
            likesCount: c.likedByMe ? c.likesCount - 1 : c.likesCount + 1,
          }
        : c;
    setComments((prev) =>
      prev.map((c) =>
        parentId
          ? c.id === parentId
            ? { ...c, replies: (c.replies ?? []).map(update) }
            : c
          : update(c),
      ),
    );
    try {
      await fetch(`/api/posts/${postId}/comments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, action: "like", userId }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditSave = async (commentId: string, parentId?: string) => {
    if (!editText.trim()) return;
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentId,
          action: "edit",
          text: editText.trim(),
        }),
      });
      const updated = (await res.json()) as Comment;
      const replace = (c: Comment) =>
        c.id === commentId ? { ...c, text: updated.text } : c;
      setComments((prev) =>
        prev.map((c) =>
          parentId
            ? c.id === parentId
              ? { ...c, replies: (c.replies ?? []).map(replace) }
              : c
            : replace(c),
        ),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setEditingId(null);
      setEditText("");
    }
  };

  const handleReport = async (commentId: string) => {
    setMenuOpenId(null);
    try {
      await fetch(`/api/posts/${postId}/comments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, action: "report", userId }),
      });
      alert("Comment reported.");
    } catch (err) {
      console.error(err);
    }
  };

  const toggleReplies = (id: string) =>
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  const CommentMenu = ({
    comment,
    parentId,
  }: {
    comment: Comment;
    parentId?: string;
  }) => {
    const isOwner = comment.author.id === userId;
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() =>
            setMenuOpenId(menuOpenId === comment.id ? null : comment.id)
          }
          className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500 hover:text-white p-0.5"
        >
          <MoreHorizontal size={14} />
        </button>
        {menuOpenId === comment.id && (
          <div className="absolute right-0 top-6 z-20 rounded-2xl shadow-2xl overflow-hidden min-w-35"
            style={{
              background: "rgba(30,30,30,0.95)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.08)",
              animation: "menuPop 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            <style>{`@keyframes menuPop { from { opacity: 0; transform: scale(0.9) translateY(-4px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>
            {isOwner ? (
              <>
                <button
                  onClick={() => {
                    setEditingId(comment.id);
                    setEditText(comment.text);
                    setMenuOpenId(null);
                  }}
                  className="flex items-center gap-2.5 w-full px-4 py-3 text-[13px] text-white hover:bg-white/5 transition-colors"
                >
                  <Pencil size={13} className="text-neutral-400 shrink-0" />{" "}
                  Edit
                </button>
                <div
                  className="h-px mx-3"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                />
                <button
                  onClick={() => void handleDelete(comment.id, parentId)}
                  className="flex items-center gap-2.5 w-full px-4 py-3 text-[13px] text-red-400 hover:bg-white/5 transition-colors"
                >
                  <Trash2 size={13} className="text-red-400 shrink-0" /> Delete
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  void handleReport(comment.id);
                }}
                className="flex items-center gap-2.5 w-full px-4 py-3 text-[13px] text-orange-400 hover:bg-[#363636] transition-colors"
              >
                <Flag size={13} className="text-orange-400 shrink-0" /> Report
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const CommentRow = ({
    comment,
    parentId,
    isReply = false,
  }: {
    comment: Comment;
    parentId?: string;
    isReply?: boolean;
  }) => (
    <div className={`group flex items-start gap-2.5 ${isReply ? "pl-10" : ""}`}
      style={{ animation: "fadeSlideIn 0.2s ease" }}
    >
      <Avatar
        src={comment.author.avatarUrl}
        name={comment.author.username}
        size={30}
      />
      <div className="flex-1 min-w-0">
        {editingId === comment.id ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  void handleEditSave(comment.id, parentId);
                if (e.key === "Escape") {
                  setEditingId(null);
                  setEditText("");
                }
              }}
              className="flex-1 text-white text-sm px-3 py-1.5 rounded-xl outline-none"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            />
            <button
              onClick={() => void handleEditSave(comment.id, parentId)}
              className="text-[#0095f6] text-xs font-semibold hover:text-blue-400 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditingId(null);
                setEditText("");
              }}
              className="text-neutral-500 text-xs"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <p className="text-white text-[13px] leading-snug">
              <span className="font-semibold mr-1">
                {comment.author.username}
              </span>
              <span
                className={
                  comment.isDeleted
                    ? "text-neutral-600 italic"
                    : "text-neutral-200"
                }
              >
                {comment.isDeleted ? "This comment was deleted." : comment.text}
              </span>
            </p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-neutral-600 text-[11px]">
                {getRelativeTime(comment.createdAt)}
              </span>
              {!comment.isDeleted && (
                <>
                  {comment.likesCount > 0 && (
                    <span className="text-neutral-500 text-[11px] font-semibold">
                      {comment.likesCount} likes
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setReplyingTo({
                        id: parentId ?? comment.id,
                        username: comment.author.username,
                      });
                      inputRef.current?.focus();
                    }}
                    className="text-neutral-500 hover:text-white text-[11px] font-semibold transition-colors"
                  >
                    Reply
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
      {!comment.isDeleted && (
        <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
          <button
            onClick={() => void handleLike(comment.id, parentId)}
            className="transition-all active:scale-125"
          >
            <Heart
              size={11}
              className={
                comment.likedByMe
                  ? "fill-red-500 text-red-500"
                  : "text-neutral-500 hover:text-neutral-300 transition-colors"
              }
            />
          </button>
          <CommentMenu comment={comment} parentId={parentId} />
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-neutral-800 border-t-neutral-400 animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-1"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <MessageCircle size={20} className="text-neutral-600" />
            </div>
            <p className="text-white text-sm font-semibold">No comments yet</p>
            <p className="text-neutral-600 text-xs">Be the first to comment</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex flex-col gap-2">
              <CommentRow comment={comment} />
              {(comment.replies?.length ?? 0) > 0 && (
                <button
                  onClick={() => toggleReplies(comment.id)}
                  className="ml-10 flex items-center gap-2 text-neutral-500 hover:text-neutral-300 text-xs font-semibold transition-colors w-fit"
                >
                  <span className="w-5 h-px inline-block"
                    style={{ background: "rgba(255,255,255,0.15)" }}
                  />
                  {expandedReplies.has(comment.id) ? (
                    <>
                      <ChevronUp size={11} /> Hide replies
                    </>
                  ) : (
                    <>
                      <ChevronDown size={11} /> View {comment.replies!.length}{" "}
                      {comment.replies!.length === 1 ? "reply" : "replies"}
                    </>
                  )}
                </button>
              )}
              {expandedReplies.has(comment.id) &&
                comment.replies?.map((reply) => (
                  <CommentRow
                    key={reply.id}
                    comment={reply}
                    parentId={comment.id}
                    isReply
                  />
                ))}
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        {replyingTo && (
          <div className="flex items-center justify-between px-4 pt-2">
            <span className="text-neutral-500 text-xs">
              Replying to{" "}
              <span className="text-white font-semibold">
                @{replyingTo.username}
              </span>
            </span>
            <button onClick={() => setReplyingTo(null)}>
              <X size={13} className="text-neutral-500 hover:text-white transition-colors" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-3 px-4 py-3">
          <button className="text-neutral-500 hover:text-white transition-colors shrink-0">
            <Smile size={20} />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handlePost();
            }}
            placeholder={
              replyingTo
                ? `Reply to @${replyingTo.username}...`
                : "Add a comment..."
            }
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-neutral-600"
          />
          <button
            onClick={() => void handlePost()}
            disabled={!text.trim() || posting}
            className="text-[#0095f6] text-sm font-semibold disabled:opacity-25 transition-opacity hover:text-blue-400 shrink-0"
          >
            {posting ? (
              <div className="w-4 h-4 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
            ) : (
              "Post"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function LightboxModal({
  posts,
  currentIndex,
  onClose,
  onPrev,
  onNext,
  userId,
  onLikeToggle,
  onSaveToggle,
}: {
  posts: PostType[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  userId: string;
  onLikeToggle: (postId: string) => void;
  onSaveToggle: (postId: string) => void;
}) {
  const post = posts[currentIndex];
  const [visible, setVisible] = useState(false);
  const [heartPop, setHeartPop] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onPrev, onNext]);

  const handleLikeWithPop = (id: string) => {
    setHeartPop(true);
    onLikeToggle(id);
    setTimeout(() => setHeartPop(false), 400);
  };

  if (!post) return null;

  const likesCount = post.likes.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: visible ? "rgba(0,0,0,0.88)" : "rgba(0,0,0,0)",
        backdropFilter: "blur(12px)",
        transition: "background 0.3s ease",
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes heartBeat {
          0% { transform: scale(1); }
          30% { transform: scale(1.4); }
          60% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 text-neutral-400 hover:text-white transition-all hover:rotate-90 duration-300"
        style={{
          background: "rgba(255,255,255,0.06)",
          borderRadius: "50%",
          padding: "8px",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <X size={18} />
      </button>

      {/* Prev */}
      {currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white transition-all hover:scale-110 active:scale-95"
          style={{
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(10px)",
            borderRadius: "50%",
            padding: "10px",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {/* Next */}
      {currentIndex < posts.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white transition-all hover:scale-110 active:scale-95"
          style={{
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(10px)",
            borderRadius: "50%",
            padding: "10px",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <ChevronRight size={20} />
        </button>
      )}

      {/*Desktop layout*/}
      <div
        className="flex overflow-hidden w-full mx-20"
        style={{
          maxWidth: "960px",
          height: "min(88vh, 680px)",
          borderRadius: "16px",
          background: "#0a0a0a",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
          animation: "modalSlideUp 0.35s cubic-bezier(0.34, 1.2, 0.64, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative flex-1 min-w-0 bg-black">
          <Image src={post.imageUrl} alt="" fill className="object-contain"
            style={{ transition: "opacity 0.3s ease" }}
          />
        </div>

        {/* Comments panel */}
        <div className="w-85 shrink-0 flex flex-col"
          style={{ borderLeft: "1px solid rgba(255,255,255,0.06)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <Link
              href={`/profile/${post.author?.username}`}
              className="flex items-center gap-3 group"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="p-0.5 rounded-full"
                style={{
                  background:
                    "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
                }}
              >
                <div className="p-[1.5px] rounded-full bg-[#0a0a0a]">
                  <Avatar
                    src={post.author?.avatarUrl}
                    name={post.author?.username}
                    size={32}
                  />
                </div>
              </div>
              <div>
                <p className="text-white text-[13px] font-semibold leading-tight group-hover:underline">
                  {post.author?.username ?? "User"}
                </p>
                {post.createdAt && (
                  <p className="text-neutral-500 text-[11px]">
                    {getRelativeTime(post.createdAt)}
                  </p>
                )}
              </div>
            </Link>
            <button className="text-neutral-500 hover:text-white transition-colors">
              <MoreHorizontal size={18} />
            </button>
          </div>

          {/*Caption+comments*/}
          <div className="flex-1 overflow-y-auto min-h-0">
            {post.caption && post.author && (
              <div className="flex items-start gap-3 px-4 py-3"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              >
                <Avatar
                  src={post.author.avatarUrl}
                  name={post.author.username}
                  size={30}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-[13px] leading-snug">
                    <span className="font-semibold mr-1">
                      {post.author.username}
                    </span>
                    <span className="text-neutral-300">{post.caption}</span>
                  </p>
                  {post.createdAt && (
                    <p className="text-neutral-600 text-[11px] mt-1">
                      {getRelativeTime(post.createdAt)}
                    </p>
                  )}
                </div>
              </div>
            )}
            <CommentSection postId={post.id} userId={userId} />
          </div>

          {/*Actions*/}
          <div className="px-4 py-3 shrink-0"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleLikeWithPop(post.id)}
                  style={{
                    animation:
                      heartPop && post.likedByMe
                        ? "heartBeat 0.4s ease"
                        : "none",
                  }}
                >
                  <Heart
                    size={22}
                    className={
                      post.likedByMe
                        ? "fill-red-500 text-red-500"
                        : "text-white hover:text-neutral-400 transition-colors"
                    }
                    style={{ transition: "color 0.15s ease, fill 0.15s ease" }}
                  />
                </button>
                <button className="text-white hover:text-neutral-400 transition-colors">
                  <MessageCircle size={22} />
                </button>
                <button
                  onClick={() => {
                    void navigator.clipboard.writeText(
                      `${window.location.origin}/p/${post.id}`,
                    );
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="text-white hover:text-neutral-400 transition-colors"
                >
                  {copied ? (
                    <Check size={20} className="text-green-400" />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </div>
              <button
                onClick={() => onSaveToggle(post.id)}
                className="transition-all active:scale-125"
              >
                <Bookmark
                  size={20}
                  className={
                    post.savedByMe
                      ? "fill-white text-white"
                      : "text-white hover:text-neutral-400 transition-colors"
                  }
                />
              </button>
            </div>
            <p className="text-white text-[13px] font-semibold">
              {likesCount.toLocaleString()}{" "}
              {likesCount === 1 ? "like" : "likes"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const userId = session?.user?.id ?? "";

  useEffect(() => {
    if (session === undefined) return;
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/posts?limit=30&userId=${userId}`);
        const data = (await res.json()) as PostType[];
        const mapped = data.map((p) => ({
          ...p,
          likedByMe: p.likes.some((l) => l.userId === userId),
        }));
        setPosts(mapped);
      } catch (err) {
        console.error("Failed to fetch posts:", err);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [session, userId]);

  const handlePrev = useCallback(() => {
    setSelectedIndex((i) => (i !== null && i > 0 ? i - 1 : i));
  }, []);

  const handleNext = useCallback(() => {
    setSelectedIndex((i) => (i !== null && i < posts.length - 1 ? i + 1 : i));
  }, [posts.length]);

  const handleLikeToggle = useCallback(
    async (postId: string) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                likedByMe: !p.likedByMe,
                likes: p.likedByMe
                  ? p.likes.filter((l) => l.userId !== userId)
                  : [...p.likes, { id: userId, userId }],
              }
            : p,
        ),
      );
      try {
        await fetch(`/api/posts/${postId}/like`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
      } catch (err) {
        console.error(err);
      }
    },
    [userId],
  );

  const handleSaveToggle = useCallback(
    async (postId: string) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, savedByMe: !p.savedByMe } : p,
        ),
      );
      try {
        await fetch(`/api/posts/${postId}/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
      } catch (err) {
        console.error(err);
      }
    },
    [userId],
  );

  return (
    <main className="min-h-screen text-white" style={{ background: "#000" }}>
      <style>{`
        @keyframes tileReveal {
          from { opacity: 0; transform: scale(0.94); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div className="mx-auto" style={{ maxWidth: "935px", padding: "0 0px" }}>
        {loading ? (
          <GridSkeleton />
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-2"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <svg
                className="w-7 h-7 text-neutral-600"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
              </svg>
            </div>
            <p className="text-white text-sm font-semibold">Nothing to explore yet</p>
            <p className="text-neutral-600 text-xs">
              Posts will appear here once shared
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3" style={{ gap: "3px" }}>
            {posts.map((post, index) => (
              <PostTile key={post.id} post={post} index={index}
                onClick={() => setSelectedIndex(index)}
                onMobileClick={() => router.push(`/post/${post.id}?source=explore`)}
              />
            ))}
          </div>
        )}
      </div>
      {selectedIndex !== null && (
        <LightboxModal
          posts={posts}
          currentIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          onPrev={handlePrev}
          onNext={handleNext}
          userId={userId}
          onLikeToggle={(id) => void handleLikeToggle(id)}
          onSaveToggle={(id) => void handleSaveToggle(id)}
        />
      )}
    </main>
  );
}