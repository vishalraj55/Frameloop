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

const STORY_DURATION = 5000;
const TICK = 50;

export default function StoryPage() {
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;

  const [stories, setStories] = useState<StoryType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const holdRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const holdTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const res = await fetch(`http://localhost:3000/stories/${username}`);
        const data = (await res.json()) as StoryType[];
        setStories(data);
      } catch (err) {
        console.error('Failed to fetch stories:', err);
      }
    };
    void fetchStories();
  }, [username]);

  const goTo = useCallback(
    (index: number) => {
      if (transitioning) return;
      setTransitioning(true);
      setLoaded(false);
      setTimeout(() => {
        setCurrentIndex(index);
        setProgress(0);
        setTransitioning(false);
      }, 180);
    },
    [transitioning]
  );

  const goNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      goTo(currentIndex + 1);
    } else {
      router.push('/feed');
    }
  }, [currentIndex, stories.length, router, goTo]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      goTo(currentIndex - 1);
    }
  }, [currentIndex, goTo]);

  // Auto-advance timer
  useEffect(() => {
    if (stories.length === 0 || !loaded) return;

    const increment = 100 / (STORY_DURATION / TICK);

    timerRef.current = setInterval(() => {
      if (holdRef.current || paused) return;
      setProgress((prev) => {
        if (prev >= 100) {
          goNext();
          return 0;
        }
        return prev + increment;
      });
    }, TICK);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, stories, goNext, currentIndex, loaded]);

  // Mark seen
  useEffect(() => {
    if (stories.length === 0) return;
    const seen = JSON.parse(localStorage.getItem('seenStories') ?? '[]') as string[];
    if (!seen.includes(username)) {
      localStorage.setItem('seenStories', JSON.stringify([...seen, username]));
    }
  }, [stories, username]);

  const handleHoldStart = () => {
    holdTimeout.current = setTimeout(() => {
      holdRef.current = true;
      setPaused(true);
    }, 150);
  };

  const handleHoldEnd = () => {
    if (holdTimeout.current) clearTimeout(holdTimeout.current);
    holdRef.current = false;
    setPaused(false);
  };

  const story = stories[currentIndex];

  if (!story) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Blurred background */}
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src={`http://localhost:3000${story.imageUrl}`}
          alt=""
          fill
          className="object-cover scale-110 blur-2xl opacity-30"
          priority
        />
      </div>

      {/* Story card — constrained width like Instagram */}
      <div
        className="relative w-full max-w-sm h-full md:h-[90vh] md:rounded-2xl overflow-hidden shadow-2xl"
        style={{ aspectRatio: '9/16' }}
      >
        {/* Story image */}
        <div
          className="absolute inset-0 transition-opacity duration-200"
          style={{ opacity: transitioning ? 0 : 1 }}
        >
          <Image
            src={`http://localhost:3000${story.imageUrl}`}
            alt=""
            fill
            priority
            className="object-cover"
            onLoad={() => setLoaded(true)}
          />
        </div>

        {/* Gradient overlays */}
        <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-black/60 via-black/20 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/50 to-transparent z-10 pointer-events-none" />

        {/* Paused indicator */}
        {paused && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
            <div className="bg-black/30 rounded-full p-4 backdrop-blur-sm">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            </div>
          </div>
        )}

        {/* Top UI */}
        <div className="absolute top-0 left-0 right-0 z-20 px-3 pt-3">
          {/* Progress bars */}
          <div className="flex gap-1 mb-3">
            {stories.map((s, i) => (
              <div
                key={s.id}
                className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-white rounded-full"
                  style={{
                    width:
                      i < currentIndex
                        ? '100%'
                        : i === currentIndex
                        ? `${progress}%`
                        : '0%',
                    transition: i === currentIndex ? `width ${TICK}ms linear` : 'none',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Author row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative h-8 w-8 rounded-full overflow-hidden ring-2 ring-white/80">
                {story.author.avatarUrl ? (
                  <Image
                    src={`http://localhost:3000${story.author.avatarUrl}`}
                    alt=""
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                    {story.author.username[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-semibold drop-shadow">
                  {story.author.username}
                </span>
                <span className="text-white/60 text-xs">
                  {currentIndex + 1} / {stories.length}
                </span>
              </div>
            </div>

            <button
              onClick={() => router.push('/feed')}
              className="text-white/80 hover:text-white transition-colors p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tap zones */}
        <div className="absolute inset-0 z-10 flex">
          {/* Prev */}
          <div
            className="w-1/3 h-full cursor-pointer"
            onClick={goPrev}
            onMouseDown={handleHoldStart}
            onMouseUp={handleHoldEnd}
            onMouseLeave={handleHoldEnd}
            onTouchStart={handleHoldStart}
            onTouchEnd={handleHoldEnd}
          />
          {/* Hold (middle) */}
          <div
            className="w-1/3 h-full cursor-pointer"
            onMouseDown={handleHoldStart}
            onMouseUp={handleHoldEnd}
            onMouseLeave={handleHoldEnd}
            onTouchStart={handleHoldStart}
            onTouchEnd={handleHoldEnd}
          />
          {/* Next */}
          <div
            className="w-1/3 h-full cursor-pointer"
            onClick={goNext}
            onMouseDown={handleHoldStart}
            onMouseUp={handleHoldEnd}
            onMouseLeave={handleHoldEnd}
            onTouchStart={handleHoldStart}
            onTouchEnd={handleHoldEnd}
          />
        </div>
      </div>
    </div>
  );
}