"use client";

import { Suspense, use, useEffect, useRef, useState } from "react";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme, THEME_COLORS } from "@/context/ThemeContext";
import Post from "@/components/Post";

interface PostData {
  id: string;
  author: {
    id: string;
    username: string;
    avatarUrl?: string;
    isFollowing?: boolean;
  };
  imageUrl: string;
  caption?: string;
  likes: { id: string; userId: string }[];
  createdAt?: string;
}

function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { resolvedTheme } = useTheme();
  const c = THEME_COLORS[resolvedTheme];
  const searchParams = useSearchParams();
  const isExplore = searchParams.get("source") === "explore";

  const [allPosts, setAllPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  const focusedRef = useRef<HTMLDivElement>(null);
  const didScroll = useRef(false);

  useEffect(() => {
    if (authLoading) return;

    (async () => {
      try {
        const headers: HeadersInit = {};
        if (user) {
          const token = await user.getIdToken();
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(`/api/posts/${id}`, {
          headers,
          cache: "no-store",
        });
        if (!res.ok) return setNotFoundState(true);
        const post: PostData = await res.json();

        if (isExplore) {
          const allRes = await fetch(
            `/api/posts?limit=30&userId=${user?.uid ?? ""}`,
            { headers, cache: "no-store" },
          );
          const all: PostData[] = allRes.ok ? await allRes.json() : [post];
          const others = all.filter((p) => p.id !== post.id);
          setAllPosts([post, ...others]);
        } else {
          const allRes = await fetch(`/api/posts/user/${post.author.id}`, {
            headers,
            cache: "no-store",
          });
          const all: PostData[] = allRes.ok ? await allRes.json() : [post];
          const others = all.filter((p) => p.id !== post.id);
          setAllPosts([post, ...others]);
        }
      } catch {
        setNotFoundState(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user, isExplore, authLoading]);

  useEffect(() => {
    if (!didScroll.current && focusedRef.current && allPosts.length > 0) {
      focusedRef.current.scrollIntoView({ behavior: "instant", block: "start" });
      didScroll.current = true;
    }
  }, [allPosts]);

  if (notFoundState) return notFound();

  if (loading) {
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{ background: c.bg }}
      >
        <div
          className="w-6 h-6 rounded-full animate-spin"
          style={{ border: `2px solid ${c.border}`, borderTopColor: c.text }}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-160 min-h-screen" style={{ background: c.bg }}>
      <div
        className="sticky top-0 z-10 flex items-center px-4 py-3 border-b"
        style={{
          background:
            resolvedTheme === "dark"
              ? "rgba(0,0,0,0.75)"
              : "rgba(255,255,255,0.75)",
          backdropFilter: "blur(12px)",
          borderColor: c.border,
        }}
      >
        <button
          onClick={() => router.back()}
          className="absolute left-4"
          style={{ color: c.text }}
          aria-label="Go back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <p className="font-semibold text-[15px] mx-auto" style={{ color: c.text }}>
          Posts
        </p>
      </div>

      <div className="flex flex-col items-center">
        {allPosts.map((post) => (
          <div
            key={post.id}
            ref={post.id === id ? focusedRef : undefined}
            className="w-full border-b"
            style={{ maxWidth: "480px", borderColor: c.border }}
          >
            <Post
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
            />
          </div>
        ))}
      </div>
    </main>
  );
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense>
      <PostPage params={params} />
    </Suspense>
  );
}