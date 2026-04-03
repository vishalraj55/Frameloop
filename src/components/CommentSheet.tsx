'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { X, Send } from 'lucide-react';

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  author: {
    username: string;
    avatarUrl?: string;
  };
}

interface Props {
  postId: string;
  open: boolean;
  onClose: () => void;
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return `${weeks}w`;
}

export default function CommentSheet({ postId, open, onClose }: Props) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

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

  // Scroll to bottom when new comment added
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [comments]);

  const handlePost = async () => {
    if (!text.trim() || !session?.user) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorId: session.user.id,
          text: text.trim(),
        }),
      });
      const comment = (await res.json()) as Comment;
      setComments((prev) => [...prev, comment]);
      setText('');
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
        <div className="w-full max-w-lg bg-[#1c1c1c] rounded-t-2xl flex flex-col"
          style={{ maxHeight: '80vh' }}
        >
          {/* Handle + header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
            <div className="w-6" />
            <div className="w-10 h-1 rounded-full bg-neutral-600 absolute left-1/2 -translate-x-1/2 top-3" />
            <span className="text-white text-sm font-semibold">Comments</span>
            <button onClick={onClose}>
              <X size={20} className="text-neutral-400" />
            </button>
          </div>

          {/* Comments list */}
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4"
          >
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
              </div>
            ) : comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <p className="text-white text-sm font-semibold">No comments yet</p>
                <p className="text-neutral-500 text-xs">Start the conversation</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 bg-neutral-700">
                    {comment.author.avatarUrl ? (
                      <Image
                        src={comment.author.avatarUrl}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-white">
                        {comment.author.username[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm leading-snug">
                      <span className="font-semibold mr-1">{comment.author.username}</span>
                      <span className="text-neutral-200">{comment.text}</span>
                    </p>
                    <span className="text-neutral-500 text-xs mt-0.5 block">
                      {getRelativeTime(comment.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-t border-neutral-800">
            {/* Current user avatar */}
            <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 bg-neutral-700">
              {session?.user?.image ? (
                <Image src={session.user.image} alt="" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-white">
                  {session?.user?.name?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handlePost(); }}
              placeholder="Add a comment..."
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-neutral-500"
            />
            <button
              onClick={() => void handlePost()}
              disabled={!text.trim() || posting}
              className="text-[#0095f6] disabled:opacity-30 transition-opacity"
            >
              <Send size={20} />
            </button>
          </div>

        </div>
      </div>
    </>
  );
}