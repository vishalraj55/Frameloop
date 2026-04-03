"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface ProfileForm {
  fullName: string;
  username: string;
  bio: string;
}

export default function EditProfilePage() {
  const { data: session, update, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ProfileForm>({
    fullName: "",
    username: "",
    bio: "",
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user?.username) {
      router.push("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/users/${session.user.username}`);
        if (!res.ok) return;
        const data = await res.json();
        setForm({
          fullName: data.fullName ?? "",
          username: data.username ?? "",
          bio: data.bio ?? "",
        });
        if (data.avatarUrl) {
          setAvatarPreview(data.avatarUrl);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
  }, [session?.user?.username, status, router]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("fullName", form.fullName);
      formData.append("username", form.username);
      formData.append("bio", form.bio);
      if (avatarFile) formData.append("avatar", avatarFile);

      const res = await fetch(`/api/users/${session?.user?.username}`, {
        method: "PATCH",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError((data.message as string) ?? "Something went wrong.");
        return;
      }

      await update({ username: form.username });
      router.push(`/profile/${form.username}`);
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  // Session loading
  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <div className="max-w-100 mx-auto bg-black min-h-screen text-white">
      {/* Avatar */}
      <div className="flex flex-col items-center py-8 bg-[#121212] border-b border-[#262626]">
        <div
          className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#333] cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          {avatarPreview ? (
            <Image
              src={avatarPreview}
              alt="avatar"
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#262626] flex items-center justify-center text-3xl font-light">
              {form.username[0]?.toUpperCase()}
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Camera size={22} className="text-white" />
          </div>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="mt-3 text-[#0095f6] text-sm font-semibold"
        >
          Change profile photo
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
      </div>

      {/* Form */}
      <div className="px-4 py-6 flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <label className="text-[12px] text-[#8e8e8e] uppercase tracking-wide">
            Full name
          </label>
          <input
            type="text"
            value={form.fullName}
            onChange={(e) =>
              setForm((p) => ({ ...p, fullName: e.target.value }))
            }
            placeholder="Full name"
            className="bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-white text-[14px] outline-none focus:border-[#555] placeholder:text-[#4e4e4e]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[12px] text-[#8e8e8e] uppercase tracking-wide">
            Username
          </label>
          <input
            type="text"
            value={form.username}
            onChange={(e) =>
              setForm((p) => ({ ...p, username: e.target.value }))
            }
            placeholder="Username"
            className="bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-white text-[14px] outline-none focus:border-[#555] placeholder:text-[#4e4e4e]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[12px] text-[#8e8e8e] uppercase tracking-wide">
            Bio
          </label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
            placeholder="Bio"
            rows={3}
            maxLength={150}
            className="bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-white text-[14px] outline-none focus:border-[#555] placeholder:text-[#4e4e4e] resize-none"
          />
          <span className="text-[11px] text-[#4e4e4e] text-right">
            {form.bio.length}/150
          </span>
        </div>

        {error && <p className="text-[#ed4956] text-sm text-center">{error}</p>}

        <button
          onClick={() => void handleSave()}
          disabled={saving}
          className="w-full bg-[#0095f6] text-white text-[15px] font-semibold py-2 rounded-lg disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>

        <button
          onClick={() => router.back()}
          className="w-full bg-[#262626] text-white text-[15px] font-semibold py-2 rounded-lg"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
