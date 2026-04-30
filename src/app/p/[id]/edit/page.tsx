"use client";

import { use, useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";

interface PostData {
  id: string;
  author: { id: string; username: string };
  imageUrl: string;
  caption?: string;
}

export default function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session, status } = useSession();

  const [post, setPost] = useState<PostData | null>(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status !== "authenticated") return;

    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/posts/${id}`,
          { cache: "no-store" },
        );
        if (!res.ok) return notFound();
        const data: PostData = await res.json();

        // Only the post author can edit
        if (data.author.id !== session.user?.id) {
          router.replace(`/p/${id}`);
          return;
        }

        setPost(data);
        setCaption(data.caption ?? "");
      } catch {
        setError("Failed to load post.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, session, status, router]);

  const handleSave = async () => {
    if (!post) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/posts/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ caption }),
        },
      );
      if (!res.ok) throw new Error("Failed to save");
      router.push(`/post/${id}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  };

  if (loading || status === "loading") {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!post) return null;

  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center px-4 py-3 border-b border-neutral-800"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
      >
        <button
          onClick={() => router.back()}
          className="text-white absolute left-4"
          aria-label="Go back"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <p className="text-white font-semibold text-[15px] mx-auto">
          Edit post
        </p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="absolute right-4 text-blue-400 font-semibold text-[15px] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Done"}
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col items-center px-4 pt-6 gap-5 max-w-120 mx-auto">
        {/* Post image preview */}
        <div className="relative w-full aspect-4/3">
          <Image
            src={post.imageUrl}
            alt="Post preview"
            fill
            className="rounded-xl object-cover"
          />
        </div>

        {/* Caption textarea */}
        <div className="w-full">
          <label className="text-neutral-400 text-xs mb-1 block">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption…"
            rows={4}
            maxLength={2200}
            className="w-full bg-neutral-900 text-white text-[15px] rounded-xl px-4 py-3 resize-none outline-none border border-neutral-800 focus:border-neutral-600 placeholder:text-neutral-600"
          />
          <p className="text-neutral-600 text-xs text-right mt-1">
            {caption.length} / 2200
          </p>
        </div>

        {/* Error */}
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        {/* Save button*/}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 text-white font-semibold text-[15px] py-3 rounded-xl transition-colors"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </main>
  );
}
