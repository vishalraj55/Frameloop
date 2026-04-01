'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useSyncExternalStore, useRef } from 'react';
import { PlusCircle } from 'lucide-react';

interface StoryType {
  id: string;
  imageUrl: string;
  author: {
    username: string;
    avatarUrl?: string;
  };
}

function subscribeToStorage(cb: () => void) {
  window.addEventListener('storage', cb);
  return () => window.removeEventListener('storage', cb);
}

const emptyArray: string[] = [];

export default function StoriesBar() {
  const [stories, setStories] = useState<StoryType[]>([]);
  const cacheRef = useRef<{ raw: string; parsed: string[] } | null>(null);

  const seenStories = useSyncExternalStore(
    subscribeToStorage,
    () => {
      const raw = localStorage.getItem('seenStories') ?? '[]';
      if (cacheRef.current?.raw === raw) return cacheRef.current.parsed;
      const parsed = JSON.parse(raw) as string[];
      cacheRef.current = { raw, parsed };
      return parsed;
    },
    () => emptyArray
  );

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stories`);
        const data = (await res.json()) as StoryType[];
        setStories(data);
      } catch (err) {
        console.error('Failed to fetch stories:', err);
      }
    };
    void fetchStories();
  }, []);

  return (
    <section className="bg-black border-b border-[#262626] overflow-x-auto scrollbar-hide">
      <div className="flex gap-3 px-3 py-3 w-max">

        {/* Your Story */}
        <div className="flex flex-col items-center gap-1 w-16.5">
          <div className="relative w-15.5 h-15.5 rounded-full border border-[#262626] bg-[#1c1c1c] flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-[#0095f6] flex items-center justify-center">
              <PlusCircle size={14} className="text-white" strokeWidth={2.5} />
            </div>
          </div>
          <span className="text-[11px] text-white w-full text-center truncate">Your story</span>
        </div>

        {/* Stories */}
        {stories.map((story) => {
          const isSeen = seenStories.includes(story.author.username);

          return (
            <Link
              key={story.id}
              href={`/story/${story.author.username}`}
              className="flex flex-col items-center gap-1 w-16.5"
            >
              <div
                className={`p-0.5 rounded-full ${
                  isSeen
                    ? 'bg-[#262626]'
                    : 'bg-linear-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]'
                }`}
              >
                <div className="p-0.5 rounded-full bg-black">
                  <div className="relative w-14.5 h-14.5 rounded-full overflow-hidden bg-[#1c1c1c]">
                    {story.author.avatarUrl ? (
                      <Image
                        src={`${process.env.NEXT_PUBLIC_API_URL}${story.author.avatarUrl}`}
                        alt={story.author.username}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-xl font-medium">
                        {story.author.username[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <span
                className={`text-[11px] w-full text-center truncate ${
                  isSeen ? 'text-[#8e8e8e]' : 'text-white'
                }`}
              >
                {story.author.username}
              </span>
            </Link>
          );
        })}

      </div>
    </section>
  );
}