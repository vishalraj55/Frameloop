'use client';

import { useEffect, useState } from 'react';
import Post from '@/components/Post';
import StoriesBar from '@/components/StoriesBar';

interface PostType {
  id: string;
  imageUrl: string;
  caption?: string;
  author: {
    username: string;
    avatarUrl?: string;
  };
  likes: { id: string }[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function FeedPage() {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(`${API_URL}/posts`);
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
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <p className="text-gray-500 text-sm">Loading...</p>
    </main>
  );

  return (
    <main className="min-h-screen bg-black">
      <StoriesBar />
      <div className="max-w-lg mx-auto">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-gray-500 text-sm">No posts yet.</p>
            <p className="text-gray-600 text-xs mt-1">Be the first to share a photo!</p>
          </div>
        ) : (
          posts.map((post) => (
            <Post
              key={post.id}
              id={post.id}
              username={post.author.username}
              avatar={post.author.avatarUrl ? `${API_URL}${post.author.avatarUrl}` : null}
              imageUrl={`${API_URL}${post.imageUrl}`}
              caption={post.caption ?? ''}
              likes={post.likes.length} createdAt={''}            />
          ))
        )}
      </div>
    </main>
  );
}