"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
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
} from "lucide-react";

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
  likes: { id: string }[];
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
      className="relative rounded-full overflow-hidden shrink-0 bg-neutral-700"
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image src={src} alt="" fill className="object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-white">
          {name?.[0]?.toUpperCase() ?? "?"}
        </div>
      )}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-0.5 sm:gap-1 md:gap-2">
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={i}
          className={`relative bg-neutral-900 animate-pulse ${
            i % 7 === 0
              ? "col-span-2 row-span-2 aspect-square"
              : "aspect-square"
          }`}
        />
      ))}
    </div>
  );
}

function PostTile({
  post,
  index,
  onClick,
}: {
  post: PostType;
  index: number;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isLarge = index % 7 === 0;
  return (
    <button
      onClick={onClick}
      className={`relative block bg-neutral-900 overflow-hidden group ${
        isLarge ? "col-span-2 row-span-2 aspect-square" : "aspect-square"
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Image
        src={post.imageUrl}
        alt=""
        fill
        className={`object-cover transition-transform duration-500 ${hovered ? "scale-110" : "scale-100"}`}
        sizes="(max-width: 768px) 33vw, 300px"
      />
      <div
        className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
          hovered ? "bg-black/50 opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex items-center gap-2 text-white font-semibold text-sm">
          <Heart className="w-5 h-5 fill-white" />
          {post.likes.length}
        </div>
      </div>
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
    if (!text.trim() || !session?.user) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
          className="text-neutral-600 hover:text-neutral-300 transition-colors opacity-0 group-hover:opacity-100 p-0.5"
        >
          <MoreHorizontal size={14} />
        </button>
        {menuOpenId === comment.id && (
          <div className="absolute right-0 top-6 z-20 bg-[#262626] rounded-xl shadow-2xl overflow-hidden min-w-35">
            {isOwner ? (
              <>
                <button
                  onClick={() => {
                    setEditingId(comment.id);
                    setEditText(comment.text);
                    setMenuOpenId(null);
                  }}
                  className="flex items-center gap-2.5 w-full px-4 py-3 text-[13px] text-white hover:bg-[#363636] transition-colors"
                >
                  <Pencil size={13} className="text-neutral-300 shrink-0" />{" "}
                  Edit
                </button>
                <button
                  onClick={() => void handleDelete(comment.id, parentId)}
                  className="flex items-center gap-2.5 w-full px-4 py-3 text-[13px] text-red-500 hover:bg-[#363636] transition-colors"
                >
                  <Trash2 size={13} className="text-red-500 shrink-0" /> Delete
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
    <div className={`group flex items-start gap-3 ${isReply ? "pl-11" : ""}`}>
      <Avatar
        src={comment.author.avatarUrl}
        name={comment.author.username}
        size={32}
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
              className="flex-1 bg-neutral-700 text-white text-sm px-3 py-1.5 rounded-lg outline-none"
            />
            <button
              onClick={() => void handleEditSave(comment.id, parentId)}
              className="text-[#0095f6] text-xs font-semibold"
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
            <p className="text-white text-sm leading-snug">
              <span className="font-semibold mr-1">
                {comment.author.username}
              </span>
              <span
                className={
                  comment.isDeleted
                    ? "text-neutral-500 italic"
                    : "text-neutral-200"
                }
              >
                {comment.isDeleted ? "This comment was deleted." : comment.text}
              </span>
            </p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-neutral-500 text-xs">
                {getRelativeTime(comment.createdAt)}
              </span>
              {!comment.isDeleted && (
                <>
                  {comment.likesCount > 0 && (
                    <span className="text-neutral-500 text-xs font-semibold">
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
                    className="text-neutral-500 hover:text-white text-xs font-semibold transition-colors"
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
            className="transition-transform active:scale-125"
          >
            <Heart
              size={12}
              className={
                comment.likedByMe
                  ? "fill-red-500 text-red-500"
                  : "text-neutral-400 hover:text-neutral-200"
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
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <p className="text-white text-sm font-semibold">No comments yet</p>
            <p className="text-neutral-500 text-xs">Start the conversation</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex flex-col gap-2">
              <CommentRow comment={comment} />
              {(comment.replies?.length ?? 0) > 0 && (
                <button
                  onClick={() => toggleReplies(comment.id)}
                  className="ml-11 flex items-center gap-2 text-neutral-500 hover:text-white text-xs font-semibold transition-colors w-fit"
                >
                  <span className="w-5 h-px bg-neutral-600 inline-block" />
                  {expandedReplies.has(comment.id) ? (
                    <>
                      <ChevronUp size={12} /> Hide replies
                    </>
                  ) : (
                    <>
                      <ChevronDown size={12} /> View {comment.replies!.length}{" "}
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
      <div className="border-t border-neutral-800 shrink-0">
        {replyingTo && (
          <div className="flex items-center justify-between px-4 pt-2.5">
            <span className="text-neutral-400 text-xs">
              Replying to{" "}
              <span className="text-white font-semibold">
                @{replyingTo.username}
              </span>
            </span>
            <button onClick={() => setReplyingTo(null)}>
              <X size={14} className="text-neutral-500" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-3 px-4 py-3">
          <button className="text-neutral-400 hover:text-white transition-colors shrink-0">
            <Smile size={22} />
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
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-neutral-500"
          />
          <button
            onClick={() => void handlePost()}
            disabled={!text.trim() || posting}
            className="text-[#0095f6] text-sm font-semibold disabled:opacity-30 transition-opacity shrink-0"
          >
            Post
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onPrev, onNext]);

  if (!post) return null;

  const likesCount = post.likes.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-neutral-300 transition-colors z-50"
      >
        <X size={28} />
      </button>

      {/* Prev */}
      {currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 hover:bg-black/80 text-white rounded-full p-2 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Next */}
      {currentIndex < posts.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 hover:bg-black/80 text-white rounded-full p-2 transition-colors"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/*Desktop layout*/}
      <div
        className="hidden md:flex bg-black rounded-xl overflow-hidden shadow-2xl w-full max-w-5xl mx-8"
        style={{ height: "min(90vh, 700px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative flex-1 min-w-0 bg-black">
          <Image src={post.imageUrl} alt="" fill className="object-contain" />
        </div>

        {/* Comments panel */}
        <div className="w-90 shrink-0 flex flex-col border-l border-neutral-800 bg-black">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 shrink-0">
            <div className="flex items-center gap-3">
              <Avatar
                src={post.author?.avatarUrl}
                name={post.author?.username}
                size={36}
              />
              <span className="text-white text-sm font-semibold">
                {post.author?.username ?? "User"}
              </span>
            </div>
            <button className="text-neutral-400 hover:text-white transition-colors">
              <MoreHorizontal size={20} />
            </button>
          </div>

          {/*Caption+comments*/}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 min-h-0">
            {post.caption && post.author && (
              <div className="flex items-start gap-3">
                <Avatar
                  src={post.author.avatarUrl}
                  name={post.author.username}
                  size={32}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm leading-snug">
                    <span className="font-semibold mr-1">
                      {post.author.username}
                    </span>
                    <span className="text-neutral-200">{post.caption}</span>
                  </p>
                  {post.createdAt && (
                    <p className="text-neutral-500 text-xs mt-1.5">
                      {getRelativeTime(post.createdAt)}
                    </p>
                  )}
                </div>
              </div>
            )}
            <CommentSection postId={post.id} userId={userId} />
          </div>

          {/*Actions*/}
          <div className="border-t border-neutral-800 px-4 py-3 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onLikeToggle(post.id)}
                  className="transition-transform active:scale-110"
                >
                  <Heart
                    size={24}
                    className={
                      post.likedByMe
                        ? "fill-red-500 text-red-500"
                        : "text-white hover:text-neutral-400 transition-colors"
                    }
                  />
                </button>
                <button className="text-white hover:text-neutral-400 transition-colors">
                  <MessageCircle size={24} />
                </button>
                <button className="text-white hover:text-neutral-400 transition-colors">
                  <Send size={22} />
                </button>
              </div>
              <button
                onClick={() => onSaveToggle(post.id)}
                className="transition-transform active:scale-110"
              >
                <Bookmark
                  size={22}
                  className={
                    post.savedByMe
                      ? "fill-white text-white"
                      : "text-white hover:text-neutral-400 transition-colors"
                  }
                />
              </button>
            </div>
            <p className="text-white text-sm font-semibold">
              {likesCount.toLocaleString()} likes
            </p>
            {post.createdAt && (
              <p className="text-neutral-500 text-xs mt-0.5">
                {getRelativeTime(post.createdAt)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/*Mobile layout- Instagram-style card*/}
      <div
        className="md:hidden flex flex-col bg-black w-full h-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/*Mobile header*/}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <Avatar
              src={post.author?.avatarUrl}
              name={post.author?.username}
              size={32}
            />
            <div>
              <p className="text-white text-sm font-semibold">
                {post.author?.username ?? "User"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-neutral-400">
              <MoreHorizontal size={20} />
            </button>
            <button onClick={onClose} className="text-neutral-400">
              <X size={20} />
            </button>
          </div>
        </div>

        {/*Mobile image*/}
        <div className="relative w-full aspect-square bg-black shrink-0">
          <Image src={post.imageUrl} alt="" fill className="object-cover" />
        </div>

        {/*Mobile actions*/}
        <div className="px-4 py-3 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <button
                onClick={() => onLikeToggle(post.id)}
                className="transition-transform active:scale-110"
              >
                <Heart
                  size={26}
                  className={
                    post.likedByMe ? "fill-red-500 text-red-500" : "text-white"
                  }
                />
              </button>
              <button className="text-white">
                <MessageCircle size={26} />
              </button>
              <button className="text-white">
                <Send size={24} />
              </button>
            </div>
            <button
              onClick={() => onSaveToggle(post.id)}
              className="transition-transform active:scale-110"
            >
              <Bookmark
                size={24}
                className={
                  post.savedByMe ? "fill-white text-white" : "text-white"
                }
              />
            </button>
          </div>
          <p className="text-white text-sm font-semibold">
            {likesCount.toLocaleString()} likes
          </p>
          {post.caption && (
            <p className="text-white text-sm mt-1 leading-snug">
              <span className="font-semibold mr-1">
                {post.author?.username}
              </span>
              <span className="text-neutral-200">{post.caption}</span>
            </p>
          )}
          {post.createdAt && (
            <p className="text-neutral-500 text-xs mt-1">
              {getRelativeTime(post.createdAt)}
            </p>
          )}
        </div>

        {/*Mobile comments*/}
        <div className="flex-1 border-t border-neutral-800">
          <CommentSection postId={post.id} userId={userId} />
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const userId = session?.user?.id ?? "";

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/posts?limit=30`);
        const data = (await res.json()) as PostType[];
        setPosts(data);
      } catch (err) {
        console.error("Failed to fetch posts:", err);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

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
                  ? p.likes.filter((l) => l.id !== userId)
                  : [...p.likes, { id: userId }],
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
    <main className="bg-black min-h-screen text-white">
      <div className="max-w-160 md:max-w-225 lg:max-w-275 mx-auto">
        {loading ? (
          <GridSkeleton />
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 gap-3 text-center">
            <div className="w-16 h-16 rounded-full border border-neutral-700 flex items-center justify-center">
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
            <p className="text-sm font-semibold">Nothing to explore yet</p>
            <p className="text-neutral-500 text-xs">
              Posts will appear here once shared
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5 sm:gap-1 md:gap-2 auto-rows-[1fr]">
            {posts.map((post, index) => (
              <PostTile key={post.id} post={post} index={index}
                onClick={() => setSelectedIndex(index)}
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