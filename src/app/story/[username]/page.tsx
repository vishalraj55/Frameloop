'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface StoryType {
  id: string;
  imageUrl: string;
  author: {
    username: string;
    avatarUrl?: string;
  };
}

export default function StoryPage() {
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;

  const [stories, setStories] = useState<StoryType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  const holdRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const res = await fetch(`http://localhost:3000/stories/${username}`);
        const data = await res.json() as StoryType[];
        setStories(data);
      } catch (err) {
        console.error('Failed to fetch stories:', err);
      }
    };

    void fetchStories();
  }, [username]);

  const goNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
      setProgress(0);
    } else {
      router.push('/feed');
    }
  }, [currentIndex, stories.length, router]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  useEffect(() => {
    if (stories.length === 0) return;

    const seen = JSON.parse(localStorage.getItem('seenStories') ?? '[]') as string[];
    if (!seen.includes(username)) {
      localStorage.setItem('seenStories', JSON.stringify([...seen, username]));
    }

    const duration = 5000;
    const interval = 50;
    const increment = 100 / (duration / interval);

    timerRef.current = setInterval(() => {
      if (holdRef.current || paused) return;
      setProgress((prev) => {
        if (prev >= 100) {
          goNext();
          return 0;
        }
        return prev + increment;
      });
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, stories, username, goNext, currentIndex]);

  const story = stories[currentIndex];

  if (!story && stories.length > 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-white">
        Story not found
      </div>
    );
  }

  if (!story) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
  }

  return (
    <main className="fixed inset-0 z-50 bg-black text-white">
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 p-3 z-50">
        <div className="flex gap-1 mb-3">
          {stories.map((s, i) => (
            <div key={s.id} className="flex-1 h-0.5 bg-white/30 rounded overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-75"
                style={{
                  width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8 rounded-full overflow-hidden">
              {story.author.avatarUrl ? (
                <Image
                  src={`http://localhost:3000${story.author.avatarUrl}`}
                  alt=""
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center text-white text-sm">
                  {story.author.username[0].toUpperCase()}
                </div>
              )}
            </div>
            <span className="text-sm font-semibold">{story.author.username}</span>
          </div>

          <button
            onClick={() => router.push('/feed')}
            className="text-white/80 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Tap zones */}
      <div className="absolute inset-0 z-40 flex">
        <div
          className="w-1/2"
          onClick={goPrev}
          onMouseDown={() => { holdRef.current = true; setPaused(true); }}
          onMouseUp={() => { holdRef.current = false; setPaused(false); }}
          onTouchStart={() => { holdRef.current = true; setPaused(true); }}
          onTouchEnd={() => { holdRef.current = false; setPaused(false); }}
        />
        <div
          className="w-1/2"
          onClick={goNext}
          onMouseDown={() => { holdRef.current = true; setPaused(true); }}
          onMouseUp={() => { holdRef.current = false; setPaused(false); }}
          onTouchStart={() => { holdRef.current = true; setPaused(true); }}
          onTouchEnd={() => { holdRef.current = false; setPaused(false); }}
        />
      </div>

      {/* Story image */}
      <Image
        src={`http://localhost:3000${story.imageUrl}`}
        alt=""
        fill
        priority
        className="object-contain"
      />
    </main>
  );
}