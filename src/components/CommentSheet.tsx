"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import {
  X,
  Heart,
  MoreHorizontal,
  Trash2,
  Pencil,
  Flag,
  ChevronDown,
  ChevronUp,
  Smile,
} from "lucide-react";

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
  postCaption?: string;
  postCreatedAt?: string;
  anchorRef?: React.RefObject<HTMLElement>;
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
function Avatar({ src, name, size = 32,}: { src?: string | null; name?: string | null; size?: number; }) {
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

function CommentInput({
  text,
  setText,
  posting,
  replyingTo,
  onPost,
  onCancelReply,
  inputRef,
}: {
  text: string;
  setText: (v: string) => void;
  posting: boolean;
  replyingTo: { id: string; username: string } | null;
  onPost: () => void;
  onCancelReply: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="border-t border-neutral-800 shrink-0">
      {replyingTo && (
        <div className="flex items-center justify-between px-4 pt-2.5">
          <span className="text-neutral-400 text-xs">
            Replying to{" "}
            <span className="text-white font-semibold">@{replyingTo.username}</span>
          </span>
          <button onClick={onCancelReply}>
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
          onKeyDown={(e) => { if (e.key === "Enter") onPost(); }}
          placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : "Add a comment..."}
          className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-neutral-500"
        />
        <button
          onClick={onPost}
          disabled={!text.trim() || posting}
          className="text-[#0095f6] text-sm font-semibold disabled:opacity-30 transition-opacity shrink-0"
        >
          Post
        </button>
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
  const { data: session } = useSession();
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

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const userId = session?.user?.id ?? "";

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
        ? { ...c, likedByMe: !c.likedByMe, likesCount: c.likedByMe ? c.likesCount - 1 : c.likesCount + 1 }
        : c;
    setComments((prev) =>
      prev.map((c) =>
        parentId
          ? c.id === parentId ? { ...c, replies: (c.replies ?? []).map(update) } : c
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
            ? c.id === parentId ? { ...c, replies: (c.replies ?? []).map(update) } : c
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
        body: JSON.stringify({ commentId, action: "edit", text: editText.trim() }),
      });
      const updated = (await res.json()) as Comment;
      const replace = (c: Comment) => c.id === commentId ? { ...c, text: updated.text } : c;
      setComments((prev) =>
        prev.map((c) =>
          parentId
            ? c.id === parentId ? { ...c, replies: (c.replies ?? []).map(replace) } : c
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
    <div key={comment.id} className={`group flex items-start gap-3 ${isReply ? "pl-11" : ""}`}>
      <Avatar src={comment.author.avatarUrl} name={comment.author.username} size={32} />
      <div className="flex-1 min-w-0">
        {editingId === comment.id ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleEditSave(comment.id, parentId);
                if (e.key === "Escape") { setEditingId(null); setEditText(""); }
              }}
              className="flex-1 bg-neutral-700 text-white text-sm px-3 py-1.5 rounded-lg outline-none"
            />
            <button onClick={() => void handleEditSave(comment.id, parentId)}
              className="text-[#0095f6] text-xs font-semibold">Save</button>
            <button onClick={() => { setEditingId(null); setEditText(""); }}
              className="text-neutral-500 text-xs">Cancel</button>
          </div>
        ) : (
          <>
            <p className="text-white text-sm leading-snug">
              <span className="font-semibold mr-1">{comment.author.username}</span>
              <span className={comment.isDeleted ? "text-neutral-500 italic" : "text-neutral-200"}>
                {comment.isDeleted ? "This comment was deleted." : comment.text}
              </span>
            </p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-neutral-500 text-xs">{getRelativeTime(comment.createdAt)}</span>
              {!comment.isDeleted && (
                <>
                  {comment.likesCount > 0 && (
                    <span className="text-neutral-500 text-xs font-semibold">{comment.likesCount} likes</span>
                  )}
                  <button
                    onClick={() => {
                      setReplyingTo({ id: parentId ?? comment.id, username: comment.author.username });
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
          <button onClick={() => void handleLike(comment.id, parentId)}
            className="transition-transform active:scale-125">
            <Heart size={12} className={
              comment.likedByMe ? "fill-red-500 text-red-500" : "text-neutral-400 hover:text-neutral-200"
            } />
          </button>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpenId(menuOpenId === comment.id ? null : comment.id)}
              className="text-neutral-500 hover:text-white transition-colors p-1 rounded-full hover:bg-neutral-700 opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal size={15} />
            </button>
            {menuOpenId === comment.id && (
              <div className="absolute right-0 top-7 z-20 bg-neutral-900 shadow-2xl border border-neutral-700/60 overflow-hidden min-w-40 py-1 rounded-md text-left">
                {comment.author.id === userId ? (
                  <>
                    <button
                      onClick={() => { setEditingId(comment.id); setEditText(comment.text); setMenuOpenId(null); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-neutral-200 hover:bg-neutral-800 hover:text-white transition-colors"
                    >
                      <Pencil size={13} className="text-neutral-400" /><span>Edit</span>
                    </button>
                    <div className="mx-3 h-px bg-neutral-700/60" />
                    <button
                      onClick={() => void handleDelete(comment.id, parentId)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-neutral-800 hover:text-red-300 transition-colors"
                    >
                      <Trash2 size={13} className="text-red-400" /><span>Delete</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => void handleReport(comment.id)}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-orange-400 hover:bg-neutral-700 transition-colors"
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
    if (loading) return (
      <div className="flex justify-center py-8">
        <div className="w-5 h-5 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
      </div>
    );
    if (comments.length === 0) return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <p className="text-white text-sm font-semibold">No comments yet</p>
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
                className="ml-11 flex items-center gap-2 text-neutral-500 hover:text-white text-xs font-semibold transition-colors w-fit"
              >
                <span className="w-5 h-px bg-neutral-600 inline-block" />
                {expandedReplies.has(comment.id) ? (
                  <><ChevronUp size={12} /> Hide replies</>
                ) : (
                  <><ChevronDown size={12} /> View {comment.replies!.length}{" "}
                    {comment.replies!.length === 1 ? "reply" : "replies"}</>
                )}
              </button>
            )}
            {expandedReplies.has(comment.id) &&
              comment.replies?.map((reply) => renderRow(reply, comment.id, true))}
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
  };

  if (!open) return null;

  return (
    <>
      {/*Mobile bottom sheet*/}
      <div className="md:hidden">
        <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
          <div
            className="w-full max-w-lg bg-[#1c1c1c] rounded-t-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: "80vh" }}
          >
            <div className="relative flex items-center justify-between px-4 py-3 border-b border-neutral-800 shrink-0">
              <div className="w-10 h-1 rounded-full bg-neutral-600 absolute left-1/2 -translate-x-1/2 top-2" />
              <div className="w-6" />
              <span className="text-white text-sm font-semibold">
                Comments {comments.length > 0 && `(${comments.length})`}
              </span>
              <button onClick={onClose}>
                <X size={20} className="text-neutral-400" />
              </button>
            </div>
            <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4">
              {renderList()}
            </div>
            <CommentInput {...inputProps} />
          </div>
        </div>
      </div>

      {/*Desktop side panel */}
      <div className="hidden md:block">
        <div className="fixed inset-0 z-40" onClick={onClose} />
        <div
          className="fixed top-0 right-0 bottom-0 z-50 flex flex-col bg-black border-l border-neutral-800 shadow-2xl"
          style={{ width: 397 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-1 border-b border-neutral-800 shrink-0">
            <div className="flex items-center gap-3">
              <Avatar src={postAuthor?.avatarUrl} name={postAuthor?.username} size={36} />
              <span className="text-white text-sm font-semibold">
                {postAuthor?.username ?? "User"}
              </span>
            </div>
            <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors ml-auto">
              <X size={20} />
            </button>
          </div>
          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
            {postCaption && postAuthor && (
              <div className="group flex items-start gap-3">
                <Avatar src={postAuthor.avatarUrl} name={postAuthor.username} size={32} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm leading-snug">
                    <span className="font-semibold mr-1">{postAuthor.username}</span>
                    <span className="text-neutral-200">{postCaption}</span>
                  </p>
                  {postCreatedAt && (
                    <p className="text-neutral-500 text-xs mt-1.5">{getRelativeTime(postCreatedAt)}</p>
                  )}
                </div>
              </div>
            )}
            {renderList()}
          </div>
          <CommentInput {...inputProps} />
        </div>
      </div>
    </>
  );
}