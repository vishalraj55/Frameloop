"use client";

import { Suspense, use, useEffect, useRef, useState } from "react";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
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
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const isExplore = searchParams.get("source") === "explore";

  const [allPosts, setAllPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  const focusedRef = useRef<HTMLDivElement>(null);
  const didScroll = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${id}`, { 
          cache: "no-store",
        });
        if (!res.ok) return setNotFoundState(true);
        const post: PostData = await res.json();

        if (isExplore) {
          const allRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/posts?limit=30&userId=${session?.user?.id ?? ""}`,
            { cache: "no-store" },
          );
          const all: PostData[] = allRes.ok ? await allRes.json() : [post];
          const others = all.filter((p) => p.id !== post.id);
          setAllPosts([post, ...others]);
        } else {
          const allRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/posts/user/${post.author.id}`,
            { cache: "no-store" },
          );
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
  }, [id, session, isExplore]);

  useEffect(() => {
    if (!didScroll.current && focusedRef.current && allPosts.length > 0) {
      focusedRef.current.scrollIntoView({ behavior: "instant", block: "start" });
      didScroll.current = true;
    }
  }, [allPosts]);

  if (notFoundState) return notFound();

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black">
      <div
        className="sticky top-0 z-10 flex items-center px-4 py-3 border-b border-neutral-800"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
      >
        <button
          onClick={() => router.back()}
          className="text-white absolute left-4"
          aria-label="Go back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <p className="text-white font-semibold text-[15px] mx-auto">Posts</p>
      </div>

      <div className="flex flex-col items-center">
        {allPosts.map((post) => (
          <div
            key={post.id}
            ref={post.id === id ? focusedRef : undefined}
            className="w-full border-b border-neutral-800"
            style={{ maxWidth: "480px" }}
          >
            <Post
              id={post.id}
              authorId={post.author.id}
              username={post.author.username}
              avatar={post.author.avatarUrl ?? null}
              imageUrl={post.imageUrl}
              caption={post.caption ?? ""}
              likes={post.likes.length}
              isLiked={post.likes.some((l) => l.userId === session?.user?.id)}
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
