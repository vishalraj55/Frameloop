'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useSyncExternalStore, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Plus } from 'lucide-react';

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
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas not supported'));
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Compression failed'));
          resolve(blob);
        },
        'image/jpeg',
        0.82,
      );
    };

    img.onerror = () => reject(new Error('Image load failed'));
    img.src = url;
  });
}

async function compressVideo(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    video.src = url;
    video.muted = true;
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

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas not supported'));

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
          ? 'video/webm;codecs=vp8'
          : 'video/webm';

      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 1_500_000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        URL.revokeObjectURL(url);
        resolve(new Blob(chunks, { type: mimeType }));
      };
      recorder.onerror = () => reject(new Error('Video compression failed'));

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
        if (recorder.state === 'recording') {
          cancelAnimationFrame(animFrame);
          recorder.stop();
        }
      }, 60_000);
    };

    video.onerror = () => reject(new Error('Video load failed'));
  });
}

export default function StoriesBar() {
  const { data: session, status } = useSession();
  const token = session?.user?.token ?? null;

  const [stories, setStories] = useState<StoryType[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadLabel, setUploadLabel] = useState('Your story');
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    () => emptyArray,
  );

  useEffect(() => {
    if (status === 'loading') return;

    const fetchStories = async () => {
      try {
        const headers: HeadersInit = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stories`, {
          headers,
        });
        const data = (await res.json()) as StoryType[];
        setStories(data);
      } catch (err) {
        console.error('Failed to fetch stories:', err);
      }
    };

    void fetchStories();
  }, [token, status]);

  const fetchStories = async () => {
    try {
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stories`, { headers });
      const data = (await res.json()) as StoryType[];
      setStories(data);
    } catch (err) {
      console.error('Failed to fetch stories:', err);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const authorId = session?.user?.id;
    if (!authorId) {
      alert('You must be logged in to post a story.');
      return;
    }

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isImage && !isVideo) {
      alert('Only images and videos are supported.');
      return;
    }

    try {
      setUploading(true);

      let compressed: Blob;
      if (isImage) {
        setUploadLabel('Compressing...');
        compressed = await compressImage(file);
      } else {
        setUploadLabel('Processing...');
        compressed = await compressVideo(file);
      }

      setUploadLabel('Uploading...');

      const ext = isImage ? 'jpg' : 'webm';
      const compressedFile = new File([compressed], `story.${ext}`, {
        type: compressed.type,
      });

      const form = new FormData();
      form.append('image', compressedFile);
      form.append('authorId', authorId);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stories`, {
        method: 'POST',
        body: form,
      });

      if (!res.ok) throw new Error('Upload failed');

      await fetchStories();
    } catch (err) {
      console.error('Story upload failed:', err);
      alert('Failed to upload story. Please try again.');
    } finally {
      setUploading(false);
      setUploadLabel('Your story');
      e.target.value = '';
    }
  };

  return (
    <section className="bg-black border-b border-[#262626] overflow-x-auto scrollbar-hide">
      <div className="flex gap-3 px-3 py-3 w-max">

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => void handleFileChange(e)}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex flex-col items-center gap-1 w-16.5 cursor-pointer disabled:opacity-60"
        >
          <div className="relative w-15.5 h-15.5 rounded-full border border-[#262626] bg-[#1c1c1c] flex items-center justify-center">
            {uploading ? (
              <div className="w-5 h-5 border-2 border-neutral-600 border-t-white rounded-full animate-spin" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#0095f6] flex items-center justify-center">
                <Plus size={14} className="text-white" strokeWidth={3} />
              </div>
            )}
          </div>
          <span className="text-[11px] text-white w-full text-center truncate">
            {uploadLabel}
          </span>
        </button>

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
                        src={story.author.avatarUrl}
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