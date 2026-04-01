"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function UploadPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [posting, setPosting] = useState(false);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  async function handlePost() {
    if (!file || !session?.user?.id) return;
    setPosting(true);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("caption", caption);
    formData.append("authorId", session.user.id);

    try {
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
    <main className="bg-[#000000] min-h-screen">
      <div className="mx-auto max-w-160 p-4">
        <h1 className="text-[16px] font-semibold mb-4 text-white">New Post</h1>

        {!preview && (
          <label className="text-white block border border-dashed border-gray-100 bg-black p-6 text-center text-sm cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            Tap to select photo
          </label>
        )}

        {preview && (
          <div className="mb-4">
            <div className="relative aspect-square bg-black">
              <Image src={preview} alt="" fill className="object-cover" />
            </div>
          </div>
        )}

        {preview && (
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption..."
            className="w-full border border-gray-300 px-3 py-2 text-[13px] mb-4 resize-none text-white bg-black"
            rows={3}
          />
        )}

        {preview && (
          <button
            onClick={handlePost}
            disabled={posting || !session}
            className={`w-full rounded-sm py-2 text-[14px] font-semibold text-white ${
              posting
                ? "bg-gray-400"
                : "bg-linear-to-b from-[#6fa4cc] to-[#3b6ea5] border border-[#2f5f8f]"
            }`}
          >
            {posting ? "Posting..." : "Post"}
          </button>
        )}
      </div>
    </main>
  );
}