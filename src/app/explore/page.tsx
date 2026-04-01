'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface PostType {
  id: string;
  imageUrl: string;
}

export default function ExplorePage() {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('http://localhost:3000/posts');
        const data = await res.json() as PostType[];
        setPosts(data);
      } catch (err) {
        console.error('Failed to fetch posts:', err);
      } finally {
        setLoading(false);
      }
    };

    void fetchPosts();
  }, []);

  if (loading) return (
    <main className="bg-black min-h-screen flex items-center justify-center text-white">
      <p>Loading...</p>
    </main>
  );

  return (
    <main className="bg-[#000000] min-h-screen">
      <div className="mx-auto max-w-160">
        <section className="grid grid-cols-3 gap-1 bg-gray-900">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/post/${post.id}`}
              className="relative aspect-square bg-black"
            >
              <Image
                src={`http://localhost:3000${post.imageUrl}`}
                alt=""
                fill
                className="object-cover"
                sizes="33vw"
              />
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}