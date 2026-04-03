"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Post from "@/components/Post";
import StoriesBar from "@/components/StoriesBar";

interface PostType {
  id: string;
  imageUrl: string;
  caption?: string;
  author: {
    username: string;
    avatarUrl?: string;
  };
  likes: { id: string }[];
  createdAt?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const PAGE_SIZE = 10;

// ─── Skeleton ───────────────────────────────────────────────────────────────

function PostSkeleton() {
  return (
    <div className="border-b border-neutral-900 pb-4 mb-2 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-8 h-8 rounded-full bg-neutral-800" />
        <div className="h-3 w-28 rounded bg-neutral-800" />
      </div>
      {/* Image */}
      <div className="w-full aspect-square bg-neutral-800" />
      {/* Actions */}
      <div className="px-4 pt-3 flex gap-4">
        <div className="h-6 w-6 rounded bg-neutral-800" />
        <div className="h-6 w-6 rounded bg-neutral-800" />
        <div className="h-6 w-6 rounded bg-neutral-800" />
      </div>
      {/* Likes + caption */}
      <div className="px-4 pt-2 flex flex-col gap-2">
        <div className="h-3 w-16 rounded bg-neutral-800" />
        <div className="h-3 w-3/4 rounded bg-neutral-800" />
        <div className="h-3 w-1/2 rounded bg-neutral-800" />
      </div>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <>
      {/* Stories skeleton */}
      <div className="flex gap-4 px-4 py-3 border-b border-neutral-900 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-1.5 animate-pulse"
          >
            <div className="w-14 h-14 rounded-full bg-neutral-800" />
            <div className="h-2 w-10 rounded bg-neutral-800" />
          </div>
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </>
  );
}

// ─── Pull-to-refresh indicator ───────────────────────────────────────────────

function RefreshIndicator({ progress }: { progress: number }) {
  const size = 24;
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const dash = (progress / 100) * circumference;

  return (
    <div
      className="flex justify-center items-center transition-all duration-150"
      style={{
        height: `${Math.max(0, progress * 0.6)}px`,
        opacity: progress / 100,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#333"
          strokeWidth={2}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="white"
          strokeWidth={2}
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function FeedPage() {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const pulling = useRef(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchPosts = useCallback(async (pageNum: number, replace = false) => {
    try {
      const res = await fetch(
        `${API_URL}/posts?page=${pageNum}&limit=${PAGE_SIZE}`,
      );
      const data = (await res.json()) as PostType[];
      setPosts((prev) => (replace ? data : [...prev, ...data]));
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const load = async () => {
      await fetchPosts(1, true);
      setInitialLoading(false);
    };
    void load();
  }, [fetchPosts]);

  // ── Infinite scroll ────

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          hasMore &&
          !loadingMore &&
          !initialLoading
        ) {
          setLoadingMore(true);
          const next = page + 1;
          setPage(next);
          void fetchPosts(next).finally(() => setLoadingMore(false));
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [fetchPosts, hasMore, loadingMore, initialLoading, page]);

  // ── Pull to refresh ────────────────────────────────────────────────────────

  const handleTouchStart = (e: React.TouchEvent) => {
    const el = scrollRef.current;
    if (el && el.scrollTop === 0) {
      touchStartY.current = e.touches[0]!.clientY;
      pulling.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!pulling.current) return;
    const delta = e.touches[0]!.clientY - touchStartY.current;
    if (delta > 0) {
      setPullProgress(Math.min(100, (delta / 80) * 100));
    }
  };

  const handleTouchEnd = async () => {
    if (!pulling.current) return;
    pulling.current = false;

    if (pullProgress >= 100) {
      setRefreshing(true);
      setPullProgress(0);
      setPage(1);
      setHasMore(true);
      await fetchPosts(1, true);
      setRefreshing(false);
    } else {
      setPullProgress(0);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      ref={scrollRef}
      className="h-screen overflow-y-auto bg-black"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => void handleTouchEnd()}
    >
      {/* Pull-to-refresh indicator */}
      {!refreshing && <RefreshIndicator progress={pullProgress} />}

      {/* Refreshing spinner */}
      {refreshing && (
        <div className="flex justify-center py-3">
          <div className="w-5 h-5 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {initialLoading ? (
        <FeedSkeleton />
      ) : (
        <main className="max-w-lg mx-auto">
          <StoriesBar />

          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full border-2 border-neutral-700 flex items-center justify-center mb-4">
                <svg
                  className="w-7 h-7 text-neutral-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
                  />
                </svg>
              </div>
              <p className="text-white font-semibold text-sm">No Posts Yet</p>
              <p className="text-neutral-500 text-xs mt-1">
                Be the first to share a photo!
              </p>
            </div>
          ) : (
            <>
              {posts.map((post, index) => (
                <Post
                  key={post.id}
                  id={post.id}
                  username={post.author.username}
                  avatar={post.author.avatarUrl ?? null}
                  imageUrl={post.imageUrl}
                  caption={post.caption ?? ""}
                  likes={post.likes.length}
                  createdAt={post.createdAt ?? ""}
                  priority={index === 0}
                />
              ))}

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="py-6 flex justify-center">
                {loadingMore && (
                  <div className="w-5 h-5 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
                )}
                {!hasMore && posts.length > 0 && (
                  <p className="text-neutral-600 text-xs"> all caught up</p>
                )}
              </div>
            </>
          )}
        </main>
      )}
    </div>
  );
}
