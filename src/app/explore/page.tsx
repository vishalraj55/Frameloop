'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface PostType {
  id: string;
  imageUrl: string;
  likes: { id: string }[];
  caption?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ─── Skeleton ────────────────────────────────────────────────────────────────

function GridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-0.5">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="relative aspect-square bg-neutral-900 animate-pulse"
          style={{ animationDelay: `${(i % 6) * 60}ms` }}
        />
      ))}
    </div>
  );
}

// ─── Grid item ───────────────────────────────────────────────────────────────

function PostTile({ post }: { post: PostType }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/post/${post.id}`}
      className="relative aspect-square block bg-neutral-900 overflow-hidden group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Image
        src={post.imageUrl}
        alt=""
        fill
        className={`object-cover transition-transform duration-300 ${hovered ? 'scale-105' : 'scale-100'}`}
        sizes="(max-width: 768px) 33vw, 320px"
      />

      {/* Hover overlay */}
      <div
        className={`absolute inset-0 bg-black/40 flex items-center justify-center gap-5 transition-opacity duration-200 ${
          hovered ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Likes */}
        <div className="flex items-center gap-1.5 text-white font-semibold text-sm drop-shadow">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          {post.likes.length}
        </div>
      </div>

      {/* Multi-image indicator (placeholder, wire up if your posts support it) */}
    </Link>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ExplorePage() {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/posts?limit=30`);
        const data = (await res.json()) as PostType[];
        setPosts(data);
      } catch (err) {
        console.error('Failed to fetch posts:', err);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <main className="bg-black min-h-screen">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="sticky top-0 z-10 bg-black border-b border-neutral-900 px-4 py-3">
          <h1 className="text-white font-semibold text-base">Explore</h1>
        </div>

        {loading ? (
          <GridSkeleton />
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-16 h-16 rounded-full border-2 border-neutral-800 flex items-center justify-center">
              <svg className="w-7 h-7 text-neutral-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
              </svg>
            </div>
            <p className="text-white text-sm font-semibold">Nothing to explore yet</p>
            <p className="text-neutral-500 text-xs">Posts will appear here once shared</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5">
            {posts.map((post) => (
              <PostTile key={post.id} post={post} />
            ))}
          </div>
        )}

      </div>
    </main>
  );
}