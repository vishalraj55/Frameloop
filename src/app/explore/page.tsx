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

function GridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-0.5 sm:gap-1 md:gap-2">
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={i}
          className={`relative bg-neutral-900 animate-pulse ${
            i % 7 === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'
          }`}
        />
      ))}
    </div>
  );
}

function PostTile({ post, index }: { post: PostType; index: number }) {
  const [hovered, setHovered] = useState(false);

  const isLarge = index % 7 === 0;

  return (
    <Link
      href={`/post/${post.id}`}
      className={`relative block bg-neutral-900 overflow-hidden group ${
        isLarge ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Image
        src={post.imageUrl}
        alt=""
        fill
        className={`object-cover transition-transform duration-500 ${
          hovered ? 'scale-110' : 'scale-100'
        }`}
        sizes="(max-width: 768px) 33vw, 300px"
      />

      <div
        className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
          hovered ? 'bg-black/50 opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center gap-2 text-white font-semibold text-sm">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          {post.likes.length}
        </div>
      </div>
    </Link>
  );
}

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
    <main className="bg-black min-h-screen text-white">

      <div className="max-w-160 md:max-w-225 lg:max-w-275 mx-auto">

        {/* Header */}
        {/* <div className="sticky top-0 z-10 backdrop-blur bg-black/80 border-b border-neutral-800 px-4 py-3">
          <h1 className="font-semibold text-base tracking-tight">
            Explore
          </h1>
        </div> */}

        {loading ? (
          <GridSkeleton />
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 gap-3 text-center">
            <div className="w-16 h-16 rounded-full border border-neutral-700 flex items-center justify-center">
              <svg
                className="w-7 h-7 text-neutral-600"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
              </svg>
            </div>
            <p className="text-sm font-semibold">Nothing to explore yet</p>
            <p className="text-neutral-500 text-xs">
              Posts will appear here once shared
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5 sm:gap-1 md:gap-2 auto-rows-[1fr]">
            {posts.map((post, index) => (
              <PostTile key={post.id} post={post} index={index} />
            ))}
          </div>
        )}

      </div>
    </main>
  );
}