"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";

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

function isVideo(url: string) {
  return /\.(mp4|webm|mov|ogg)$/i.test(url) || url.includes("/video/upload/");
}

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef(0);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/stories/${username}`,
        );
        const data = (await res.json()) as StoryType[];
        setStories(data);
      } catch (err) {
        console.error("Failed to fetch stories:", err);
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
    [transitioning],
  );

  const goNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      goTo(currentIndex + 1);
    } else {
      setTimeout(() => router.push("/feed"), 0);
    }
  }, [currentIndex, stories.length, router, goTo]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      goTo(currentIndex - 1);
    }
  }, [currentIndex, goTo]);

  useEffect(() => {
    const video = videoRef.current;
    const story = stories[currentIndex];
    if (!video || !story || !isVideo(story.imageUrl)) return;

    const onTimeUpdate = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };
    const onEnded = () => goNext();

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);
    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
    };
  }, [currentIndex, stories, goNext]);

  useEffect(() => {
    const video = videoRef.current;
    const story = stories[currentIndex];
    if (!video || !story || !isVideo(story.imageUrl)) return;

    if (paused) {
      video.pause();
    } else {
      void video.play().catch(() => null);
    }
  }, [paused, currentIndex, stories]);

  useEffect(() => {
    const story = stories[currentIndex];
    if (!story || isVideo(story.imageUrl)) return;
    if (stories.length === 0 || !loaded) return;

    progressRef.current = 0;
    const increment = 100 / (STORY_DURATION / TICK);

    timerRef.current = setInterval(() => {
      if (holdRef.current || paused) return;

      progressRef.current += increment;

      if (progressRef.current >= 100) {
        clearInterval(timerRef.current!);
        progressRef.current = 0;
        goNext();
        return;
      }

      setProgress(progressRef.current);
    }, TICK);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      setProgress(0);
    };
  }, [paused, stories, currentIndex, loaded, goNext]);

  useEffect(() => {
    if (stories.length === 0) return;
    const seen = JSON.parse(
      localStorage.getItem("seenStories") ?? "[]",
    ) as string[];
    if (!seen.includes(username)) {
      localStorage.setItem("seenStories", JSON.stringify([...seen, username]));
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
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const storyIsVideo = isVideo(story.imageUrl);

  return (
    <div className="fixed inset-0 z-50 bg-black">

      {/* Blurred background — fills entire screen */}
      <div className="absolute inset-0 overflow-hidden">
        {storyIsVideo ? (
          <video
            src={story.imageUrl}
            className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-40"
            muted
            playsInline
            autoPlay
            loop
            onCanPlay={(e) => {
              void (e.target as HTMLVideoElement).play().catch(() => null);
            }}
          />
        ) : (
          <Image
            src={story.imageUrl}
            alt=""
            fill
            className="object-cover scale-110 blur-2xl opacity-40"
            priority
          />
        )}
      </div>

      {/* Story content — true full screen, centered on desktop */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="
            relative w-full h-full
            md:w-97.5 md:h-full md:max-h-screen
          "
        >
          {/* Media — object-contain so nothing is cropped */}
          <div
            className="absolute inset-0 transition-opacity duration-200"
            style={{ opacity: transitioning ? 0 : 1 }}
          >
            {storyIsVideo ? (
              <video
                ref={videoRef}
                src={story.imageUrl}
                className="w-full h-full object-contain"
                playsInline
                autoPlay
                onCanPlay={(e) => {
                  void (e.target as HTMLVideoElement).play().catch(() => null);
                  setLoaded(true);
                }}
              />
            ) : (
              <Image
                src={story.imageUrl}
                alt=""
                fill
                priority
                className="object-contain"
                onLoad={() => setLoaded(true)}
              />
            )}
          </div>

          {/* Top gradient */}
          <div className="absolute inset-x-0 top-0 h-36 bg-linear-to-b from-black/70 via-black/20 to-transparent z-10 pointer-events-none" />
          {/* Bottom gradient */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-black/60 to-transparent z-10 pointer-events-none" />

          {/* Pause indicator */}
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

          {/* Progress bars + header */}
          <div className="absolute top-0 left-0 right-0 z-20 px-3 pt-12 md:pt-4">
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
                          ? "100%"
                          : i === currentIndex
                            ? `${progress}%`
                            : "0%",
                      transition:
                        i === currentIndex ? `width ${TICK}ms linear` : "none",
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative h-9 w-9 rounded-full overflow-hidden ring-2 ring-white/80 shrink-0">
                  {story.author.avatarUrl ? (
                    <Image
                      src={story.author.avatarUrl}
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
                  <span className="text-white text-sm font-semibold drop-shadow-md">
                    {story.author.username}
                  </span>
                  <span className="text-white/60 text-xs">
                    {currentIndex + 1} / {stories.length}
                  </span>
                </div>
              </div>

              <button
                onClick={() => router.push("/feed")}
                className="text-white/80 hover:text-white transition-colors p-1"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Tap zones */}
          <div className="absolute inset-0 z-10 flex">
            <div
              className="w-1/3 h-full cursor-pointer"
              onClick={goPrev}
              onMouseDown={handleHoldStart}
              onMouseUp={handleHoldEnd}
              onMouseLeave={handleHoldEnd}
              onTouchStart={handleHoldStart}
              onTouchEnd={handleHoldEnd}
            />
            <div
              className="w-1/3 h-full cursor-pointer"
              onMouseDown={handleHoldStart}
              onMouseUp={handleHoldEnd}
              onMouseLeave={handleHoldEnd}
              onTouchStart={handleHoldStart}
              onTouchEnd={handleHoldEnd}
            />
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
    </div>
  );
}