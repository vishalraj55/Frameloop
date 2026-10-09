"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  X,
  Heart,
  MoreHorizontal,
  Trash2,
  Pencil,
  Flag,
  ChevronDown,
  ChevronUp,
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
  parentId?: string;
  replies?: Comment[];
}

interface Props {
  postId: string;
  open: boolean;
  onClose: () => void;
  postAuthor?: Author;
  postCaption?: string | null;
  postCreatedAt?: string;
  anchorRef?: React.RefObject<HTMLElement>;
}

const GLASS =
  "bg-white/50 dark:bg-black/40 backdrop-blur-2xl backdrop-saturate-150 border border-black/10 dark:border-white/10 shadow-2xl";

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
      className="relative rounded-full overflow-hidden shrink-0 bg-neutral-300 dark:bg-neutral-700"
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image src={src} alt="" fill className="object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-neutral-800 dark:text-white">
          {name?.[0]?.toUpperCase() ?? "?"}
        </div>
      )}
    </div>
  );
}

function PostHeader({
  author,
  caption,
  createdAt,
}: {
  author?: Author;
  caption?: string | null;
  createdAt?: string;
}) {
  if (!author && !caption) return null;
  return (
    <div className="flex items-start gap-3 px-5 py-3 border-b border-black/10 dark:border-white/10 shrink-0">
      <Avatar
        src={author?.avatarUrl}
        name={author?.username ?? "User"}
        size={36}
      />
      <div className="flex-1 min-w-0">
        <p className="text-neutral-900 dark:text-white text-sm leading-snug wrap-break-word">
          <span className="font-semibold mr-1.5">
            {author?.username ?? "User"}
          </span>
          {caption && (
            <span className="text-neutral-700 dark:text-neutral-200">
              {caption}
            </span>
          )}
        </p>
        {createdAt && (
          <p className="text-neutral-500 text-xs mt-1">
            {getRelativeTime(createdAt)}
          </p>
        )}
      </div>
    </div>
  );
}

function CommentInput({
  text,
  setText,
  posting,
  replyingTo,
  onPost,
  onCancelReply,
  inputRef,
  avatarUrl,
  avatarName,
  bordered = false,
}: {
  text: string;
  setText: (v: string) => void;
  posting: boolean;
  replyingTo: { id: string; username: string } | null;
  onPost: () => void;
  onCancelReply: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  avatarUrl?: string | null;
  avatarName?: string | null;
  bordered?: boolean;
}) {
  return (
    <div
      className={`shrink-0 ${
        bordered ? "border-t border-black/10 dark:border-white/10" : ""
      }`}
    >
      {replyingTo && (
        <div className="flex items-center justify-between px-4 pt-2.5">
          <span className="text-neutral-500 dark:text-neutral-400 text-xs">
            Replying to{" "}
            <span className="text-neutral-900 dark:text-white font-semibold">
              @{replyingTo.username}
            </span>
          </span>
          <button onClick={onCancelReply}>
            <X size={14} className="text-neutral-500" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar src={avatarUrl} name={avatarName ?? "?"} size={36} />
        <div className="flex flex-1 items-center gap-2 rounded-full border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 pl-4 pr-3 py-2">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onPost();
            }}
            placeholder={
              replyingTo
                ? `Reply to @${replyingTo.username}...`
                : "Add a comment..."
            }
            className="flex-1 min-w-0 bg-transparent text-neutral-900 dark:text-white text-sm outline-none placeholder:text-neutral-500"
          />
          {text.trim() && (
            <button
              onClick={onPost}
              disabled={posting}
              className="text-[#0095f6] text-sm font-semibold disabled:opacity-30 transition-opacity shrink-0"
            >
              Post
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommentSheet({
  postId,
  open,
  onClose,
  postAuthor,
  postCaption,
  postCreatedAt,
}: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
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

  const [fetchedPost, setFetchedPost] = useState<{
    author?: Author;
    caption?: string | null;
    createdAt?: string;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const userId = user?.uid ?? "";
  const userLabel = user ? (user.displayName ?? user.email ?? "?") : "?";

  const headerAuthor = postAuthor ?? fetchedPost?.author;
  const headerCaption = postCaption ?? fetchedPost?.caption;
  const headerCreatedAt = postCreatedAt ?? fetchedPost?.createdAt;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
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
    setTimeout(() => inputRef.current?.focus(), 300);
  }, [open, postId]);

  useEffect(() => {
    if (!open || (postAuthor && postCaption)) return;
    const loadPost = async () => {
      try {
        const res = await fetch(`${API_URL}/posts/${postId}`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          author?: Author;
          caption?: string | null;
          createdAt?: string;
        };
        setFetchedPost({
          author: data.author,
          caption: data.caption,
          createdAt: data.createdAt,
        });
      } catch (err) {
        console.error(err);
      }
    };
    void loadPost();
  }, [open, postId, postAuthor, postCaption]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-menu]")) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onWheel = (e: WheelEvent) => {
      if (!window.matchMedia("(min-width: 768px)").matches) return;
      if (panelRef.current?.contains(e.target as Node)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const handlePost = async () => {
    if (!text.trim() || !user) return;
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

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, userId }),
      });
      if (!res.ok) {
        const rollback = await fetch(`/api/posts/${postId}/comments`);
        const data = (await rollback.json()) as Comment[];
        setComments(data);
      }
    } catch (err) {
      console.error(err);
      const rollback = await fetch(`/api/posts/${postId}/comments`);
      const data = (await rollback.json()) as Comment[];
      setComments(data);
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
      setComments((prev) =>
        prev.map((c) =>
          parentId
            ? c.id === parentId
              ? { ...c, replies: (c.replies ?? []).map(update) }
              : c
            : update(c),
        ),
      );
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
      alert("Comment reported. Thank you for your feedback.");
    } catch (err) {
      console.error(err);
    }
  };

  const toggleReplies = (id: string) =>
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const renderRow = (comment: Comment, parentId?: string, isReply = false) => (
    <div
      key={comment.id}
      className={`group flex items-start gap-3 ${isReply ? "pl-11" : ""}`}
    >
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
              className="flex-1 bg-black/5 dark:bg-white/10 text-neutral-900 dark:text-white text-sm px-3 py-1.5 rounded-lg outline-none"
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
            <p className="text-neutral-900 dark:text-white text-sm leading-snug">
              <span className="font-semibold mr-1">
                {comment.author.username}
              </span>
              <span
                className={
                  comment.isDeleted
                    ? "text-neutral-500 italic"
                    : "text-neutral-700 dark:text-neutral-200"
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
                    className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white text-xs font-semibold transition-colors"
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
                  : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
              }
            />
          </button>
          <div className="relative" data-menu>
            <button
              onClick={() =>
                setMenuOpenId(menuOpenId === comment.id ? null : comment.id)
              }
              className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal size={15} />
            </button>
            {menuOpenId === comment.id && (
              <div className="absolute right-0 top-7 z-20 bg-white dark:bg-neutral-900 shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden min-w-40 py-1 rounded-md text-left">
                {comment.author.id === userId ? (
                  <>
                    <button
                      onClick={() => {
                        setEditingId(comment.id);
                        setEditText(comment.text);
                        setMenuOpenId(null);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-neutral-800 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                      <Pencil size={13} className="text-neutral-500" />
                      <span>Edit</span>
                    </button>
                    <div className="mx-3 h-px bg-black/10 dark:bg-white/10" />
                    <button
                      onClick={() => void handleDelete(comment.id, parentId)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                      <Trash2 size={13} className="text-red-500" />
                      <span>Delete</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => void handleReport(comment.id)}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-orange-500 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  >
                    <Flag size={14} /> Report
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderList = () => {
    if (loading)
      return (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 border-2 border-neutral-400 dark:border-neutral-700 border-t-neutral-900 dark:border-t-white rounded-full animate-spin" />
        </div>
      );
    if (comments.length === 0)
      return (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <p className="text-neutral-900 dark:text-white text-sm font-semibold">
            No comments yet
          </p>
          <p className="text-neutral-500 text-xs">Start the conversation</p>
        </div>
      );
    return (
      <>
        {comments.map((comment) => (
          <div key={comment.id} className="flex flex-col gap-2">
            {renderRow(comment)}
            {(comment.replies?.length ?? 0) > 0 && (
              <button
                onClick={() => toggleReplies(comment.id)}
                className="ml-11 flex items-center gap-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white text-xs font-semibold transition-colors w-fit"
              >
                <span className="w-5 h-px bg-neutral-400 dark:bg-neutral-600 inline-block" />
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
              comment.replies?.map((reply) =>
                renderRow(reply, comment.id, true),
              )}
          </div>
        ))}
      </>
    );
  };

  const inputProps = {
    text,
    setText,
    posting,
    replyingTo,
    onPost: () => void handlePost(),
    onCancelReply: () => setReplyingTo(null),
    inputRef,
    avatarUrl: user?.photoURL,
    avatarName: userLabel,
  };

  if (!open) return null;

  return (
    <>
      <div className="md:hidden">
        <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
          <div
            className="w-full max-w-lg rounded-t-2xl flex flex-col overflow-hidden bg-white/80 dark:bg-[#1c1c1c]/80 backdrop-blur-2xl border border-black/10 dark:border-white/10"
            style={{ maxHeight: "80vh" }}
          >
            <div className="relative flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/10 shrink-0">
              <div className="w-10 h-1 rounded-full bg-neutral-400 dark:bg-neutral-600 absolute left-1/2 -translate-x-1/2 top-2" />
              <div className="w-6" />
              <span className="text-neutral-900 dark:text-white text-sm font-semibold">
                Comments {comments.length > 0 && `(${comments.length})`}
              </span>
              <button onClick={onClose}>
                <X
                  size={20}
                  className="text-neutral-500 dark:text-neutral-400"
                />
              </button>
            </div>
            <PostHeader
              author={headerAuthor}
              caption={headerCaption}
              createdAt={headerCreatedAt}
            />
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4"
            >
              {renderList()}
            </div>
            <CommentInput {...inputProps} bordered />
          </div>
        </div>
      </div>

      {/*Desktop floating panel */}
      <div className="hidden md:block">
        <div className="fixed inset-0 z-40" onClick={onClose} />
        <div
          ref={panelRef}
          className="fixed left-70 top-55 bottom-5 z-50 w-100 max-w-[calc(100vw-2rem)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={`h-full flex flex-col rounded-3xl overflow-hidden ${GLASS}`}
          >
            <div className="relative flex items-center justify-center px-5 py-4 shrink-0">
              <button
                onClick={onClose}
                className="absolute left-5 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                <X size={22} />
              </button>
              <span className="text-neutral-900 dark:text-white text-sm font-semibold">
                Comments
              </span>
            </div>

            <PostHeader
              author={headerAuthor}
              caption={headerCaption}
              createdAt={headerCreatedAt}
            />

            <div
              ref={listRef}
              className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5 [scrollbar-width:thin] [scrollbar-color:#9ca3af_transparent]"
            >
              {renderList()}
            </div>

            <CommentInput {...inputProps} />
          </div>

          <div className="absolute top-10 -right-1.75 w-4 h-4 rotate-45 bg-white/50 dark:bg-black/40 backdrop-blur-2xl border-t border-r border-black/10 dark:border-white/10" />
        </div>
      </div>
    </>
  );
}