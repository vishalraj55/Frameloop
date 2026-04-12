"use client";

import { useState, useCallback } from "react";
import { Heart } from "lucide-react";

interface Props {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
  showCount?: boolean;
}

export function LikeButton({ postId, initialLiked, initialCount, showCount = true }: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const toggle = useCallback(async () => {
    if (loading) return;
    setLiked((p) => !p);
    setCount((p) => (liked ? p - 1 : p + 1));
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
      if (!res.ok) { setLiked((p) => !p); setCount((p) => (liked ? p + 1 : p - 1)); return; }
      const data = await res.json() as { liked: boolean; count: number };
      setLiked(data.liked);
      setCount(data.count);
    } catch {
      setLiked((p) => !p);
      setCount((p) => (liked ? p + 1 : p - 1));
    } finally {
      setLoading(false);
    }
  }, [postId, liked, loading]);

  return (
    <button onClick={toggle} disabled={loading} className="flex items-center gap-1.5 group" aria-label={liked ? "Unlike" : "Like"}>
      <Heart
        size={24}
        strokeWidth={1.8}
        className={`transition-all duration-150 ${liked ? "fill-[#ed4956] stroke-[#ed4956] scale-110" : "fill-transparent stroke-white group-hover:stroke-[#ed4956]"} ${loading ? "opacity-60" : ""}`}
      />
      {showCount && count > 0 && (
        <span className={`text-[13px] font-semibold transition-colors ${liked ? "text-[#ed4956]" : "text-white"}`}>
          {count}
        </span>
      )}
    </button>
  );
}