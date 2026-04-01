"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
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
  username: string;
  avatar: string | null;
  imageUrl: string;
  caption?: string;
  likes: number;
  createdAt: string;
};

export default function Post({
  id,
  username,
  avatar,
  imageUrl,
  caption,
  likes,
  createdAt,
}: PostProps) {
  const lastTapRef = useRef(0);

  const likedKey = "likedPosts";
  const savedKey = "savedPosts";

  function getStored(key: string): string[] {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem(key) || "[]");
  }

  const [liked, setLiked] = useState(() => getStored(likedKey).includes(id));
  const [saved, setSaved] = useState(() => getStored(savedKey).includes(id));
  const [likeCount, setLikeCount] = useState(likes + (getStored(likedKey).includes(id) ? 1 : 0));

  function toggleLike() {
    const arr = getStored(likedKey);
    const isLiked = arr.includes(id);
    const updated = isLiked ? arr.filter((x) => x !== id) : [...arr, id];
    localStorage.setItem(likedKey, JSON.stringify(updated));
    setLiked(!isLiked);
    setLikeCount((prev) => prev + (isLiked ? -1 : 1));
  }

  function toggleSave() {
    const arr = getStored(savedKey);
    const isSaved = arr.includes(id);
    const updated = isSaved ? arr.filter((x) => x !== id) : [...arr, id];
    localStorage.setItem(savedKey, JSON.stringify(updated));
    setSaved(!isSaved);
  }

  function handleDoubleTap() {
    const now = Date.now();
    if (now - lastTapRef.current < 300 && !liked) toggleLike();
    lastTapRef.current = now;
  }

  return (
    <article className="border-b border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          {avatar ? (
            <Image
              src={avatar}
              alt={username}
              width={32}
              height={32}
              className="rounded-full border border-zinc-700"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-zinc-700" />
          )}
          <Link href={`/profile/${username}`}>
            <span className="text-sm font-semibold text-white">{username}</span>
          </Link>
        </div>
        <MoreHorizontal size={20} className="text-white cursor-pointer" />
      </div>

      {/* Image */}
      <div onClick={handleDoubleTap}>
        <Image
          src={imageUrl}
          alt=""
          width={640}
          height={640}
          className="w-full block"
        />
      </div>

      {/* Action bar */}
      <div className="flex items-center px-3 py-2 gap-4">
        <button onClick={toggleLike} className="flex items-center">
          <Heart
            size={24}
            className={liked ? "text-[#ed4956]" : "text-white"}
            fill={liked ? "#ed4956" : "none"}
          />
        </button>
        <button className="flex items-center">
          <MessageCircle size={24} className="text-white" />
        </button>
        <button className="flex items-center">
          <Send size={24} className="text-white" />
        </button>
        <div className="flex-1" />
        <button onClick={toggleSave} className="flex items-center">
          <Bookmark
            size={24}
            className="text-white"
            fill={saved ? "white" : "none"}
          />
        </button>
      </div>

      {/* Likes */}
      <div className="px-3 text-sm font-semibold text-white">
        {likeCount.toLocaleString()} likes
      </div>

      {/* Caption */}
      {caption && (
        <div className="px-3 py-1 text-sm text-white">
          <span className="font-semibold">{username}</span>{" "}
          <span className="text-zinc-300">{caption}</span>
        </div>
      )}

      {/* Time */}
      <div className="px-3 pb-3 text-[11px] text-zinc-500 uppercase tracking-wide">
        {getRelativeTime(createdAt)}
      </div>
    </article>
  );
}