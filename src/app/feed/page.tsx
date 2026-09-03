"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Post from "@/components/Post";
import StoriesBar from "@/components/StoriesBar";
import { useAuth } from "@/context/AuthContext";
import { useTheme, THEME_COLORS } from "@/context/ThemeContext";

interface PostType {
  id: string;
  imageUrl: string;
  caption?: string;
  author: {
    id: string;
    username: string;
    avatarUrl?: string;
    isFollowing?: boolean;
  };
  likes: { id: string; userId: string }[];
  createdAt?: string;
}

const PAGE_SIZE = 10;

function PostSkeleton({
  c,
}: {
  c: (typeof THEME_COLORS)[keyof typeof THEME_COLORS];
}) {
  return (
    <div
      className="border-b pb-4 mb-1 overflow-hidden"
      style={{ borderColor: c.border }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className="w-9 h-9 rounded-full shrink-0 shimmer"
          style={{ background: c.card }}
        />
        <div className="flex flex-col gap-1.5 flex-1">
          <div
            className="h-2.5 w-24 rounded-full shimmer"
            style={{ background: c.card }}
          />
          <div
            className="h-2 w-16 rounded-full shimmer"
            style={{ background: c.cardMuted }}
          />
        </div>
      </div>
      <div
        className="w-full aspect-square shimmer"
        style={{ background: c.cardFaint }}
      />
      <div className="px-4 pt-3 flex items-center gap-4">
        <div
          className="h-5 w-5 rounded-full shimmer"
          style={{ background: c.card }}
        />
        <div
          className="h-5 w-5 rounded-full shimmer"
          style={{ background: c.card }}
        />
        <div
          className="h-5 w-5 rounded-full shimmer"
          style={{ background: c.card }}
        />
      </div>
      <div className="px-4 pt-3 flex flex-col gap-2">
        <div
          className="h-2.5 w-20 rounded-full shimmer"
          style={{ background: c.card }}
        />
        <div
          className="h-2.5 w-4/5 rounded-full shimmer"
          style={{ background: c.cardMuted }}
        />
        <div
          className="h-2.5 w-1/2 rounded-full shimmer"
          style={{ background: c.cardFaint }}
        />
      </div>
    </div>
  );
}

function FeedSkeleton({
  c,
}: {
  c: (typeof THEME_COLORS)[keyof typeof THEME_COLORS];
}) {
  return (
    <>
      <style>{`
  .shimmer { position: relative; overflow: hidden; }
  .shimmer::after {
    content: ""; position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%);
    background-size: 200% 100%;
    animation: shimmerBg 1.6s ease-in-out infinite;
  }
  @keyframes shimmerBg { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
`}</style>
      <div className="flex gap-3 px-3 py-6 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-1 w-21 shrink-0"
          >
            <div
              className="w-21 h-21 rounded-full shimmer"
              style={{ background: c.cardFaint }}
            />
            <div
              className="h-2 w-10 rounded-full shimmer"
              style={{ background: c.card }}
            />
          </div>
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <PostSkeleton key={i} c={c} />
      ))}
    </>
  );
}

function RefreshIndicator({
  progress,
  c,
}: {
  progress: number;
  c: (typeof THEME_COLORS)[keyof typeof THEME_COLORS];
}) {
  const size = 28;
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const dash = (progress / 100) * circumference;

  return (
    <div
      className="flex justify-center items-center"
      style={{
        height: `${Math.max(0, progress * 0.56)}px`,
        opacity: Math.min(1, progress / 60),
        transition: "height 80ms linear",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        style={{ transform: `rotate(-90deg) scale(${0.6 + progress * 0.004})` }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={c.border}
          strokeWidth={2}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={c.text}
          strokeWidth={2}
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function EmptyFeed({
  c,
}: {
  c: (typeof THEME_COLORS)[keyof typeof THEME_COLORS];
}) {
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center px-8">
      <div
        className="w-20 h-20 rounded-full border flex items-center justify-center mb-5"
        style={{ borderColor: c.border, background: c.card }}
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke={c.textFaint}
          strokeWidth={1.25}
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
      <p className="font-semibold text-[15px] mb-1" style={{ color: c.text }}>
        No posts yet
      </p>
      <p
        className="text-[13px] leading-relaxed max-w-55"
        style={{ color: c.textMuted }}
      >
        Follow people to see their photos here.
      </p>
    </div>
  );
}

/*Page*/

export default function FeedPage() {
  const { user, loading: authLoading } = useAuth();
  const { resolvedTheme } = useTheme();
  const c = THEME_COLORS[resolvedTheme];
  const [posts, setPosts] = useState<PostType[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const pulling = useRef(false);

  const fetchPosts = useCallback(
    async (cursorParam?: string, replace = false) => {
      try {
        const params = new URLSearchParams();
        params.set("limit", String(PAGE_SIZE));
        if (cursorParam) params.set("cursor", cursorParam);

        const token = await user?.getIdToken();
        const res = await fetch(`/api/posts?${params.toString()}`, {
          headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        });

        const text = await res.text();
        const data = JSON.parse(text) as PostType[];
        if (!Array.isArray(data)) return;

        setPosts((prev) => {
          if (replace) return data;
          const seen = new Set(prev.map((p) => p.id));
          return [...prev, ...data.filter((p) => !seen.has(p.id))];
        });

        setHasMore(data.length === PAGE_SIZE);

        if (data.length > 0) {
          setCursor(data[data.length - 1]!.id);
        }
      } catch (err) {
        console.error("Failed to fetch posts:", err);
      }
    },
    [user],
  );

  useEffect(() => {
    if (authLoading) return;
    const load = async () => {
      await fetchPosts(undefined, true);
      setInitialLoading(false);
    };
    void load();
  }, [fetchPosts, authLoading, user]);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      if (
        entries[0]?.isIntersecting &&
        hasMore &&
        !loadingMore &&
        !initialLoading
      ) {
        setLoadingMore(true);
        void fetchPosts(cursor).finally(() => setLoadingMore(false));
      }
    });

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [fetchPosts, hasMore, loadingMore, initialLoading, cursor]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
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
      setCursor(undefined);
      setHasMore(true);
      await fetchPosts(undefined, true);
      setRefreshing(false);
    } else {
      setPullProgress(0);
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: c.bg }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => void handleTouchEnd()}
    >
      {!refreshing && <RefreshIndicator progress={pullProgress} c={c} />}

      {refreshing && (
        <div className="flex justify-center py-3">
          <div
            className="w-5 h-5 rounded-full animate-spin"
            style={{
              border: `1.5px solid ${c.border}`,
              borderTopColor: c.text,
            }}
          />
        </div>
      )}

      <div className="mx-auto w-full max-w-160">
        {initialLoading ? (
          <FeedSkeleton c={c} />
        ) : (
          <main>
            <StoriesBar />

            {posts.length === 0 ? (
              <EmptyFeed c={c} />
            ) : (
              <>
                {posts.map((post, index) => (
                  <Post
                    key={post.id}
                    id={post.id}
                    authorId={post.author.id}
                    username={post.author.username}
                    avatar={post.author.avatarUrl ?? null}
                    imageUrl={post.imageUrl}
                    caption={post.caption ?? ""}
                    likes={post.likes.length}
                    isLiked={post.likes.some((l) => l.userId === user?.uid)}
                    createdAt={post.createdAt ?? ""}
                    isFollowing={post.author.isFollowing ?? false}
                    priority={index === 0}
                  />
                ))}

                <div ref={sentinelRef} className="py-8 flex justify-center">
                  {loadingMore && (
                    <div
                      className="w-5 h-5 rounded-full animate-spin"
                      style={{
                        border: `1.5px solid ${c.border}`,
                        borderTopColor: c.text,
                      }}
                    />
                  )}
                  {!hasMore && posts.length > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="h-px w-12" style={{ background: c.bg }} />
                      <p
                        className="text-[11px] tracking-widest uppercase"
                        style={{ color: c.textFaint }}
                      >
                        all caught up
                      </p>
                      <div className="h-px w-12" style={{ background: c.bg }} />
                    </div>
                  )}
                </div>
              </>
            )}
          </main>
        )}
      </div>
    </div>
  );
}