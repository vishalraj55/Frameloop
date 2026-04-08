"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, ImagePlus } from "lucide-react";

type FilterType =
  | "normal"
  | "grayscale"
  | "sepia"
  | "bright"
  | "contrast"
  | "cool"
  | "warm";

const filters: Record<FilterType, string> = {
  normal: "none",
  grayscale: "grayscale(100%)",
  sepia: "sepia(80%)",
  bright: "brightness(1.2)",
  contrast: "contrast(1.4)",
  cool: "hue-rotate(180deg)",
  warm: "hue-rotate(-20deg) saturate(1.3)",
};

export default function UploadPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [posting, setPosting] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("normal");

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  function removeImage() {
    setFile(null);
    setPreview(null);
    setSelectedFilter("normal");
  }

  async function applyFilterToImage(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!preview) return reject();

      const img = new window.Image();
      img.src = preview;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return reject();

        ctx.filter = filters[selectedFilter];
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          if (!blob) return reject();
          resolve(blob);
        }, "image/jpeg", 0.9);
      };

      img.onerror = reject;
    });
  }

  async function handlePost() {
    if (!file || !session?.user?.id) return;

    setPosting(true);

    try {
      const filteredBlob = await applyFilterToImage();
      const finalFile = new File([filteredBlob], "post.jpg", {
        type: "image/jpeg",
      });

      const formData = new FormData();
      formData.append("image", finalFile);
      formData.append("caption", caption);
      formData.append("authorId", session.user.id);

      const res = await fetch("http://localhost:3000/posts", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        router.push("/feed");
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setPosting(false);
    }
  }

  return (
    <main className="bg-black min-h-screen text-white">
      <div className="mx-auto max-w-md md:max-w-lg lg:max-w-xl px-4 py-6">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-semibold">Create Post</h1>
          {preview && (
            <button
              onClick={handlePost}
              disabled={posting || !session}
              className="text-sm font-semibold text-blue-500 disabled:opacity-50"
            >
              {posting ? "Posting..." : "Share"}
            </button>
          )}
        </div>

        {!preview && (
          <label className="flex flex-col items-center justify-center border border-neutral-800 rounded-xl h-75 cursor-pointer hover:bg-neutral-900 transition">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />

            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center">
                <ImagePlus size={22} />
              </div>
              <span className="text-sm text-neutral-400">
                Select a photo
              </span>
            </div>
          </label>
        )}

        {preview && (
          <div className="relative mb-4">
            <div className="relative aspect-square rounded-xl overflow-hidden">
              <Image
                src={preview}
                alt=""
                fill
                className="object-cover"
                style={{ filter: filters[selectedFilter] }}
              />
            </div>

            <button
              onClick={removeImage}
              className="absolute top-3 right-3 bg-black/70 rounded-full p-1.5"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {preview && (
          <div className="flex gap-3 overflow-x-auto mb-4 pb-2">
            {(Object.keys(filters) as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setSelectedFilter(f)}
                className="flex flex-col items-center gap-1 min-w-15"
              >
                <div
                  className={`relative w-14 h-14 rounded-lg overflow-hidden border ${
                    selectedFilter === f
                      ? "border-white"
                      : "border-neutral-700"
                  }`}
                >
                  <Image
                    src={preview}
                    alt=""
                    fill
                    className="object-cover"
                    style={{ filter: filters[f] }}
                  />
                </div>
                <span className="text-[11px] capitalize text-neutral-300">
                  {f}
                </span>
              </button>
            ))}
          </div>
        )}

        {preview && (
          <div className="mb-4">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-3 text-sm resize-none"
              rows={4}
              maxLength={2200}
            />
            <div className="text-right text-xs text-neutral-500 mt-1">
              {caption.length}/2200
            </div>
          </div>
        )}

        {preview && (
          <button
            onClick={handlePost}
            disabled={posting || !session}
            className={`w-full py-3 rounded-xl text-sm font-semibold ${
              posting
                ? "bg-neutral-700"
                : "bg-white text-black hover:opacity-90"
            }`}
          >
            {posting ? "Posting..." : "Share Post"}
          </button>
        )}
      </div>
    </main>
  );
}