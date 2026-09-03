"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore, useRef } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Plus } from "lucide-react";
import { useTheme, THEME_COLORS } from "@/context/ThemeContext";

interface StoryType {
  id: string;
  imageUrl: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
}

interface StoryGroup {
  authorId: string;
  username: string;
  avatarUrl?: string;
  stories: StoryType[];
}

const SEEN_KEY = "seenStoryIds";
const emptyArray: string[] = [];

function subscribeToStorage(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

function readSeenIds(): string[] {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((v) => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

function markStoryIdsSeen(ids: string[]) {
  try {
    const current = new Set(readSeenIds());
    ids.forEach((id) => current.add(id));
    localStorage.setItem(SEEN_KEY, JSON.stringify([...current]));
    window.dispatchEvent(new Event("storage"));
  } catch {}
}
function groupStoriesByAuthor(stories: StoryType[]): StoryGroup[] {
  const map = new Map<string, StoryGroup>();

  for (const story of stories) {
    if (!story?.id || !story.author?.id) continue;

    const key = story.author.id;
    const existing = map.get(key);

    if (existing) {
      if (!existing.stories.some((s) => s.id === story.id)) {
        existing.stories.push(story);
      }
    } else {
      map.set(key, {
        authorId: story.author.id,
        username: story.author.username || "user",
        avatarUrl: story.author.avatarUrl,
        stories: [story],
      });
    }
  }

  for (const group of map.values()) {
    group.stories.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }

  return Array.from(map.values());
}

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 1080;
      let { width, height } = img;
      if (width > height && width > MAX) {
        height = Math.round((height * MAX) / width);
        width = MAX;
      } else if (height > width && height > MAX) {
        width = Math.round((width * MAX) / height);
        height = MAX;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Compression failed"));
          resolve(blob);
        },
        "image/jpeg",
        0.82,
      );
    };

    img.onerror = () => reject(new Error("Image load failed"));
    img.src = url;
  });
}

async function compressVideo(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    video.src = url;
    video.muted = false;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      const MAX = 720;
      let { videoWidth: w, videoHeight: h } = video;
      if (w > h && w > MAX) {
        h = Math.round((h * MAX) / w);
        w = MAX;
      } else if (h > w && h > MAX) {
        w = Math.round((w * MAX) / h);
        h = MAX;
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaElementSource(video);
      const audioDestination = audioCtx.createMediaStreamDestination();
      source.connect(audioDestination);

      const videoStream = canvas.captureStream(30);
      const audioStream = audioDestination.stream;

      const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ]);

      const mimeType = MediaRecorder.isTypeSupported(
        "video/webm;codecs=vp9,opus",
      )
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
          ? "video/webm;codecs=vp8,opus"
          : "video/webm";

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 1_500_000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        URL.revokeObjectURL(url);
        void audioCtx.close();
        resolve(new Blob(chunks, { type: mimeType }));
      };
      recorder.onerror = () => reject(new Error("Video compression failed"));

      let animFrame: number;
      const drawFrame = () => {
        if (video.paused || video.ended) return;
        ctx.drawImage(video, 0, 0, w, h);
        animFrame = requestAnimationFrame(drawFrame);
      };

      recorder.start();
      void video.play();
      video.onplay = () => drawFrame();
      video.onended = () => {
        cancelAnimationFrame(animFrame);
        recorder.stop();
      };

      setTimeout(() => {
        if (recorder.state === "recording") {
          cancelAnimationFrame(animFrame);
          recorder.stop();
        }
      }, 60_000);
    };

    video.onerror = () => reject(new Error("Video load failed"));
  });
}

export default function StoriesBar() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const { resolvedTheme } = useTheme();
  const c = THEME_COLORS[resolvedTheme];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const [stories, setStories] = useState<StoryType[]>([]);
  const [fetchError, setFetchError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadLabel, setUploadLabel] = useState("Your story");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cacheRef = useRef<{ raw: string; parsed: string[] } | null>(null);

  const seenIds = useSyncExternalStore(
    subscribeToStorage,
    () => {
      const raw = localStorage.getItem(SEEN_KEY) ?? "[]";
      if (cacheRef.current?.raw === raw) return cacheRef.current.parsed;
      const parsed = readSeenIds();
      cacheRef.current = { raw, parsed };
      return parsed;
    },
    () => emptyArray,
  );

  const fetchStories = async () => {
    try {
      const headers: HeadersInit = {};
      if (user) {
        const token = await user.getIdToken();
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stories`, {
        headers,
      });
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

      const data = (await res.json()) as unknown;
      setStories(Array.isArray(data) ? (data as StoryType[]) : []);
      setFetchError(false);
    } catch (err) {
      console.error("Failed to fetch stories:", err);
      setFetchError(true);
      // keep previous `stories` on screen rather than wiping the bar
    }
  };

  useEffect(() => {
    if (!authReady) return;
    void fetchStories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, user]);

  const groups = groupStoriesByAuthor(stories);
  const ownGroup = user
    ? groups.find((g) => g.authorId === user.uid)
    : undefined;
  const otherGroups = groups.filter((g) => g.authorId !== user?.uid);

  const isGroupUnseen = (group: StoryGroup) =>
    group.stories.some((s) => !seenIds.includes(s.id));
  const sortedOtherGroups = [...otherGroups].sort((a, b) => {
    const aUnseen = isGroupUnseen(a);
    const bUnseen = isGroupUnseen(b);
    if (aUnseen !== bUnseen) return aUnseen ? -1 : 1;

    const aLatest = new Date(
      a.stories[a.stories.length - 1].createdAt,
    ).getTime();
    const bLatest = new Date(
      b.stories[b.stories.length - 1].createdAt,
    ).getTime();
    return bLatest - aLatest;
  });

  const hasUnseenOwnStory = !!ownGroup && isGroupUnseen(ownGroup);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user) {
      alert("You must be logged in to post a story.");
      e.target.value = "";
      return;
    }

    if (file.size === 0) {
      alert("That file appears to be empty.");
      e.target.value = "";
      return;
    }

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isImage && !isVideo) {
      alert("Only images and videos are supported.");
      e.target.value = "";
      return;
    }

    try {
      setUploading(true);

      let compressed: Blob;
      if (isImage) {
        setUploadLabel("Compressing...");
        compressed = await compressImage(file);
      } else {
        setUploadLabel("Processing...");
        compressed = await compressVideo(file);
      }

      setUploadLabel("Uploading...");

      const ext = isImage ? "jpg" : "webm";
      const compressedFile = new File([compressed], `story.${ext}`, {
        type: isImage ? "image/jpeg" : "video/webm",
      });

      const token = await user.getIdToken();
      const form = new FormData();
      form.append("image", compressedFile);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stories`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);

      await fetchStories();
    } catch (err) {
      console.error("Story upload failed:", err);
      alert("Failed to upload story. Please try again.");
    } finally {
      setUploading(false);
      setUploadLabel("Your story");
      e.target.value = "";
    }
  };

  return (
    <section
      className="overflow-x-auto scrollbar-hide"
      style={{ background: c.bg }}
    >
      <div className="flex gap-6 px-6 py-6 w-max">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => void handleFileChange(e)}
        />

        {ownGroup ? (
          <Link
            href={`/story/${user?.displayName ?? ""}`}
            className="flex flex-col items-center gap-1 w-16.5"
          >
            <div
              className={`relative p-1 rounded-full ${
                hasUnseenOwnStory
                  ? "bg-linear-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]"
                  : ""
              }`}
              style={!hasUnseenOwnStory ? { background: c.border } : undefined}
            >
              <div className="p-0.5 rounded-full" style={{ background: c.bg }}>
                <div
                  className="relative w-21 h-21 rounded-full flex items-center justify-center overflow-hidden"
                  style={{ background: c.card }}
                >
                  {ownGroup.avatarUrl ? (
                    <Image
                      src={ownGroup.avatarUrl}
                      alt="Your story"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-xl font-medium"
                      style={{ color: c.text }}
                    >
                      {ownGroup.username?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#0095f6] border-2 border-black flex items-center justify-center disabled:opacity-60"
              >
                {uploading ? (
                  <div className="w-2.5 h-2.5 border-[1.5px] border-white/40 border-t-white rounded-full animate-spin"style={{ color: c.text }} />
                ) : (
                  <Plus size={10} strokeWidth={3} />
                )}
              </button>
            </div>
            <span
              className="text-[11px] w-full text-center truncate"
              style={{ color: c.text }}
            >
              {uploading ? uploadLabel : "Your story"}
            </span>
          </Link>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex flex-col items-center gap-1 w-16.5 cursor-pointer disabled:opacity-60"
          >
            <div
              className="p-0.5 rounded-full"
              style={{ background: c.border }}
            >
              <div className="p-0.5 rounded-full" style={{ background: c.bg }}>
                <div
                  className="relative w-21 h-21 rounded-full"
                  style={{ background: c.card }}
                >
                  {uploading ? (
                    <div className="w-5 h-5 border-2 border-neutral-600 border-t-white rounded-full animate-spin" />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-xl font-medium"
                      style={{ color: c.text }}
                    >
                      <Plus size={14} strokeWidth={3} />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <span
              className="text-[11px] w-full text-center truncate"
              style={{ color: c.text }}
            >
              {uploadLabel}
            </span>
          </button>
        )}

        {fetchError && stories.length === 0 && (
          <div
            className="flex items-center text-[11px] px-2"
            style={{ color: c.textMuted }}
          >
            Couldn&apos;t load stories
          </div>
        )}

        {sortedOtherGroups.map((group) => {
          const isSeen = !isGroupUnseen(group);
          const displayName = group.username || "user";

          return (
            <Link
              key={group.authorId}
              href={`/story/${displayName}`}
              onClick={() => markStoryIdsSeen(group.stories.map((s) => s.id))}
              className="flex flex-col items-center gap-1 w-21"
            >
              <div
                className={`relative p-0.5 rounded-full ${
                  hasUnseenOwnStory
                    ? "bg-linear-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]"
                    : ""
                }`}
                style={
                  !hasUnseenOwnStory ? { background: c.border } : undefined
                }
              >
                <div
                  className="p-0.5 rounded-full"
                  style={{ background: c.bg }}
                >
                  <div
                    className="relative w-21 h-21 rounded-full overflow-hidden"
                    style={{ background: c.card }}
                  >
                    {group.avatarUrl ? (
                      <Image
                        src={group.avatarUrl}
                        alt={displayName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-xl font-medium"
                        style={{ color: c.text }}
                      >
                        {displayName[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <span
                className="text-[11px] w-full text-center truncate"
                style={{ color: isSeen ? c.textMuted : c.text }}
              >
                {displayName}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}