"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon,
  Plus,
  Trash2,
  X,
  Check,
  Globe,
  Lock,
} from "lucide-react";

// const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface ProfileForm {
  fullName: string;
  username: string;
  bio: string;
  website: string;
  pronouns: string;
  gender: string;
  customGender: string;
  isPrivate: boolean;
  showActivityStatus: boolean;
  allowStoryResharing: boolean;
  links: { title: string; url: string }[];
}

const PRONOUNS_OPTIONS = [
  "Prefer not to say",
  "he/him",
  "she/her",
  "they/them",
  "he/they",
  "she/they",
  "Custom",
];

const GENDER_OPTIONS = [
  "Prefer not to say",
  "Male",
  "Female",
  "Non-binary",
  "Custom",
];

type SheetType = null | "pronouns" | "gender" | "links" | "addLink" | "privacy";

export default function EditProfilePage() {
  const { data: session, update, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ProfileForm>({
    fullName: "",
    username: "",
    bio: "",
    website: "",
    pronouns: "Prefer not to say",
    gender: "Prefer not to say",
    customGender: "",
    isPrivate: false,
    showActivityStatus: true,
    allowStoryResharing: true,
    links: [],
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSheet, setActiveSheet] = useState<SheetType>(null);
  const [newLink, setNewLink] = useState({ title: "", url: "" });
  const [showSuccess, setShowSuccess] = useState(false);

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
        setForm((p) => ({
          ...p,
          fullName: data.fullName ?? "",
          username: data.username ?? "",
          bio: data.bio ?? "",
          website: data.website ?? "",
          pronouns: data.pronouns ?? "Prefer not to say",
          gender: data.gender ?? "Prefer not to say",
          customGender: data.customGender ?? "",
          isPrivate: data.isPrivate ?? false,
          showActivityStatus: data.showActivityStatus ?? true,
          allowStoryResharing: data.allowStoryResharing ?? true,
          links: data.links ?? [],
        }));
        if (data.avatarUrl) setAvatarPreview(data.avatarUrl);
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

  function removeAvatar() {
    setAvatarFile(null);
    setAvatarPreview(null);
  }

  function addLink() {
    if (!newLink.url) return;
    setForm((p) => ({ ...p, links: [...p.links, { ...newLink }] }));
    setNewLink({ title: "", url: "" });
    setActiveSheet("links");
  }

  function removeLink(i: number) {
    setForm((p) => ({ ...p, links: p.links.filter((_, idx) => idx !== i) }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("fullName", form.fullName);
      formData.append("username", form.username);
      formData.append("bio", form.bio);
      formData.append("website", form.website);
      formData.append("pronouns", form.pronouns);
      formData.append(
        "gender",
        form.gender === "Custom" ? form.customGender : form.gender,
      );
      formData.append("isPrivate", String(form.isPrivate));
      formData.append("showActivityStatus", String(form.showActivityStatus));
      formData.append("allowStoryResharing", String(form.allowStoryResharing));
      formData.append("links", JSON.stringify(form.links));
      if (avatarFile) formData.append("avatar", avatarFile);
      formData.append("token", session?.user?.token ?? "");

      const res = await fetch(`/api/users/${session?.user?.username}`, {
        method: "PATCH",
        headers: {
        },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError((data.message as string) ?? "Something went wrong.");
        return;
      }

      await update({ username: form.username });
      setShowSuccess(true);
      setTimeout(() => router.push(`/profile/${form.username}`), 1200);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
      </main>
    );
  }

  /* ─── Bottom-sheet wrapper ─── */
  const Sheet = ({
    children,
    onClose,
  }: {
    children: React.ReactNode;
    onClose: () => void;
  }) => (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="bg-[#1c1c1c] rounded-t-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-[#3e3e3e] rounded-full mx-auto mt-3 mb-2" />
        {children}
      </div>
    </div>
  );

  /* ─── Toggle ─── */
  const Toggle = ({
    on,
    onChange,
  }: {
    on: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <button
      onClick={() => onChange(!on)}
      className={`relative w-12 h-7 rounded-full transition-colors ${on ? "bg-[#0095f6]" : "bg-[#3e3e3e]"}`}
    >
      <span
        className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-all shadow ${on ? "left-5.5" : "left-0.5"}`}
      />
    </button>
  );

  /* ─── Section divider ─── */
  const Divider = () => <div className="h-px bg-[#262626] mx-4" />;

  /* ─── Section header ─── */
  const SectionHeader = ({ title }: { title: string }) => (
    <p className="px-4 pt-5 pb-2 text-[13px] font-semibold text-[#8e8e8e] uppercase tracking-wide">
      {title}
    </p>
  );

  return (
    <div className="max-w-md mx-auto bg-black min-h-screen text-white pb-20">
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-black border-b border-[#262626]">
        <button onClick={() => router.back()} className="p-1">
          <ChevronLeft size={24} className="text-white" />
        </button>
        <h1 className="text-[17px] font-semibold">Edit profile</h1>
        <button
          onClick={() => void handleSave()}
          disabled={saving}
          className="text-[#0095f6] text-[15px] font-semibold disabled:opacity-50"
        >
          {saving ? "Saving…" : showSuccess ? "✓" : "Done"}
        </button>
      </div>

      {/* ── Avatar ── */}
      <div className="flex flex-col items-center py-6 border-b border-[#262626]">
        <div
          className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          {avatarPreview ? (
            <Image src={avatarPreview} alt="avatar" fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-[#262626] flex items-center justify-center text-4xl font-light text-white">
              {form.username[0]?.toUpperCase()}
            </div>
          )}
          <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
            <Camera size={24} className="text-white" />
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-[#0095f6] text-[14px] font-semibold"
          >
            Change photo
          </button>
          {avatarPreview && (
            <button
              onClick={removeAvatar}
              className="text-[#ed4956] text-[14px] font-semibold"
            >
              Remove photo
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
      </div>

      {/* ── Personal info ── */}
      <SectionHeader title="Personal information" />

      <div className="bg-[#121212] mx-4 rounded-2xl overflow-hidden border border-[#262626]">
        {/* Full name */}
        <div className="px-4 py-3">
          <label className="block text-[11px] text-[#8e8e8e] uppercase tracking-wider mb-1">
            Name
          </label>
          <input
            type="text"
            value={form.fullName}
            onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
            placeholder="Full name"
            className="w-full bg-transparent text-white text-[15px] outline-none placeholder:text-[#4e4e4e]"
          />
        </div>
        <Divider />
        {/* Username */}
        <div className="px-4 py-3">
          <label className="block text-[11px] text-[#8e8e8e] uppercase tracking-wider mb-1">
            Username
          </label>
          <input
            type="text"
            value={form.username}
            onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
            placeholder="Username"
            className="w-full bg-transparent text-white text-[15px] outline-none placeholder:text-[#4e4e4e]"
          />
        </div>
        <Divider />
        {/* Bio */}
        <div className="px-4 py-3">
          <label className="block text-[11px] text-[#8e8e8e] uppercase tracking-wider mb-1">
            Bio
          </label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
            placeholder="Bio"
            rows={3}
            maxLength={150}
            className="w-full bg-transparent text-white text-[15px] outline-none resize-none placeholder:text-[#4e4e4e]"
          />
          <p className="text-[11px] text-[#4e4e4e] text-right">{form.bio.length}/150</p>
        </div>
        <Divider />
        {/* Pronouns */}
        <button
          onClick={() => setActiveSheet("pronouns")}
          className="w-full px-4 py-3 text-left active:bg-[#1e1e1e]"
        >
          <label className="block text-[11px] text-[#8e8e8e] uppercase tracking-wider mb-1">
            Pronouns
          </label>
          <div className="flex items-center justify-between">
            <span className="text-[15px] text-white">
              {form.pronouns === "Prefer not to say" ? (
                <span className="text-[#4e4e4e]">Add pronouns</span>
              ) : (
                form.pronouns
              )}
            </span>
            <ChevronRight size={16} className="text-[#4e4e4e]" />
          </div>
        </button>
      </div>

      {/* ── Website & links ── */}
      <SectionHeader title="Website" />

      <div className="bg-[#121212] mx-4 rounded-2xl overflow-hidden border border-[#262626]">
        <div className="px-4 py-3">
          <label className="block text-[11px] text-[#8e8e8e] uppercase tracking-wider mb-1">
            Website
          </label>
          <input
            type="url"
            value={form.website}
            onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
            placeholder="Website"
            className="w-full bg-transparent text-white text-[15px] outline-none placeholder:text-[#4e4e4e]"
          />
        </div>
        <Divider />
        <button
          onClick={() => setActiveSheet("links")}
          className="w-full px-4 py-3 flex items-center justify-between active:bg-[#1e1e1e]"
        >
          <div className="flex items-center gap-3">
            <LinkIcon size={18} className="text-[#8e8e8e]" />
            <div className="text-left">
              <p className="text-[15px] text-white">Links</p>
              <p className="text-[12px] text-[#8e8e8e]">
                {form.links.length === 0
                  ? "Add links to your profile"
                  : `${form.links.length} link${form.links.length !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-[#4e4e4e]" />
        </button>
      </div>

      {/* ── Privacy ── */}
      <SectionHeader title="Privacy" />

      <div className="bg-[#121212] mx-4 rounded-2xl overflow-hidden border border-[#262626]">
        <div className="px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {form.isPrivate ? (
              <Lock size={18} className="text-[#8e8e8e]" />
            ) : (
              <Globe size={18} className="text-[#8e8e8e]" />
            )}
            <div>
              <p className="text-[15px] text-white">Private account</p>
              <p className="text-[12px] text-[#8e8e8e] mt-0.5">
                Only your followers can see your posts
              </p>
            </div>
          </div>
          <Toggle
            on={form.isPrivate}
            onChange={(v) => setForm((p) => ({ ...p, isPrivate: v }))}
          />
        </div>
        <Divider />
        <div className="px-4 py-3.5 flex items-center justify-between">
          <div>
            <p className="text-[15px] text-white">Activity status</p>
            <p className="text-[12px] text-[#8e8e8e] mt-0.5">
              Show when you were last active
            </p>
          </div>
          <Toggle
            on={form.showActivityStatus}
            onChange={(v) => setForm((p) => ({ ...p, showActivityStatus: v }))}
          />
        </div>
        <Divider />
        <div className="px-4 py-3.5 flex items-center justify-between">
          <div>
            <p className="text-[15px] text-white">Allow story resharing</p>
            <p className="text-[12px] text-[#8e8e8e] mt-0.5">
              Let others share your stories
            </p>
          </div>
          <Toggle
            on={form.allowStoryResharing}
            onChange={(v) => setForm((p) => ({ ...p, allowStoryResharing: v }))}
          />
        </div>
      </div>

      {/* ── Personal details ── */}
      <SectionHeader title="Personal details" />

      <div className="bg-[#121212] mx-4 rounded-2xl overflow-hidden border border-[#262626]">
        <button
          onClick={() => setActiveSheet("gender")}
          className="w-full px-4 py-3.5 flex items-center justify-between active:bg-[#1e1e1e]"
        >
          <div className="text-left">
            <p className="text-[15px] text-white">Gender</p>
            <p className="text-[13px] text-[#8e8e8e] mt-0.5">
              {form.gender === "Prefer not to say"
                ? "Not specified"
                : form.gender === "Custom"
                  ? form.customGender || "Custom"
                  : form.gender}
            </p>
          </div>
          <ChevronRight size={16} className="text-[#4e4e4e]" />
        </button>
      </div>

      {/* ── Danger zone ── */}
      <SectionHeader title="Account" />

      <div className="bg-[#121212] mx-4 rounded-2xl overflow-hidden border border-[#262626]">
        <button className="w-full px-4 py-3.5 text-left active:bg-[#1e1e1e]">
          <p className="text-[15px] text-[#ed4956]">Deactivate account</p>
        </button>
        <Divider />
        <button className="w-full px-4 py-3.5 text-left active:bg-[#1e1e1e]">
          <p className="text-[15px] text-[#ed4956]">Delete account</p>
        </button>
      </div>

      {error && (
        <p className="text-[#ed4956] text-sm text-center mt-4">{error}</p>
      )}

      {/* ── Save button ── */}
      <div className="px-4 mt-6">
        <button
          onClick={() => void handleSave()}
          disabled={saving}
          className="w-full bg-[#0095f6] text-white text-[15px] font-semibold py-3 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {showSuccess ? (
            <>
              <Check size={18} />
              Saved!
            </>
          ) : saving ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "Save changes"
          )}
        </button>
        <button
          onClick={() => router.back()}
          className="w-full mt-3 bg-transparent border border-[#333] text-white text-[15px] font-semibold py-3 rounded-xl"
        >
          Cancel
        </button>
      </div>

      {/* Pronouns sheet */}
      {activeSheet === "pronouns" && (
        <Sheet onClose={() => setActiveSheet(null)}>
          <div className="px-4 pb-2 pt-1 flex items-center justify-between">
            <h2 className="text-[17px] font-semibold">Pronouns</h2>
            <button onClick={() => setActiveSheet(null)}>
              <X size={22} className="text-white" />
            </button>
          </div>
          <p className="px-4 pb-4 text-[13px] text-[#8e8e8e]">
            Your pronouns are visible to everyone.
          </p>
          {PRONOUNS_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                setForm((p) => ({ ...p, pronouns: opt }));
                setActiveSheet(null);
              }}
              className="w-full px-4 py-3.5 flex items-center justify-between active:bg-[#2a2a2a]"
            >
              <span className="text-[15px] text-white">{opt}</span>
              {form.pronouns === opt && (
                <Check size={18} className="text-[#0095f6]" />
              )}
            </button>
          ))}
          <div className="h-6" />
        </Sheet>
      )}

      {/* Gender sheet */}
      {activeSheet === "gender" && (
        <Sheet onClose={() => setActiveSheet(null)}>
          <div className="px-4 pb-2 pt-1 flex items-center justify-between">
            <h2 className="text-[17px] font-semibold">Gender</h2>
            <button onClick={() => setActiveSheet(null)}>
              <X size={22} className="text-white" />
            </button>
          </div>
          <p className="px-4 pb-4 text-[13px] text-[#8e8e8e]">
            This won&apos;t be part of your public profile.
          </p>
          {GENDER_OPTIONS.map((opt) => (
            <div key={opt}>
              <button
                onClick={() => setForm((p) => ({ ...p, gender: opt }))}
                className="w-full px-4 py-3.5 flex items-center justify-between active:bg-[#2a2a2a]"
              >
                <span className="text-[15px] text-white">{opt}</span>
                {form.gender === opt && (
                  <Check size={18} className="text-[#0095f6]" />
                )}
              </button>
              {opt === "Custom" && form.gender === "Custom" && (
                <div className="px-4 pb-3">
                  <input
                    type="text"
                    value={form.customGender}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, customGender: e.target.value }))
                    }
                    placeholder="Your gender"
                    className="w-full bg-[#262626] border border-[#3e3e3e] rounded-xl px-3 py-2.5 text-white text-[15px] outline-none placeholder:text-[#4e4e4e]"
                  />
                </div>
              )}
            </div>
          ))}
          <div className="px-4 py-4">
            <button
              onClick={() => setActiveSheet(null)}
              className="w-full bg-[#0095f6] text-white text-[15px] font-semibold py-3 rounded-xl"
            >
              Done
            </button>
          </div>
        </Sheet>
      )}

      {/* Links sheet */}
      {activeSheet === "links" && (
        <Sheet onClose={() => setActiveSheet(null)}>
          <div className="px-4 pb-2 pt-1 flex items-center justify-between">
            <button onClick={() => setActiveSheet(null)}>
              <X size={22} className="text-white" />
            </button>
            <h2 className="text-[17px] font-semibold">Links</h2>
            <button
              onClick={() => setActiveSheet("addLink")}
              className="text-[#0095f6] text-[15px] font-semibold"
            >
              Add
            </button>
          </div>
          {form.links.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <LinkIcon size={36} className="text-[#3e3e3e]" />
              <p className="text-[15px] text-[#8e8e8e]">No links yet</p>
              <button
                onClick={() => setActiveSheet("addLink")}
                className="flex items-center gap-2 bg-[#262626] rounded-xl px-4 py-2.5 text-[14px] text-white font-semibold"
              >
                <Plus size={16} />
                Add link
              </button>
            </div>
          ) : (
            <div className="py-2">
              {form.links.map((link, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3 border-b border-[#262626]"
                >
                  <div className="w-9 h-9 rounded-full bg-[#262626] flex items-center justify-center shrink-0">
                    <LinkIcon size={16} className="text-[#8e8e8e]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {link.title && (
                      <p className="text-[14px] font-semibold text-white truncate">
                        {link.title}
                      </p>
                    )}
                    <p className="text-[13px] text-[#0095f6] truncate">{link.url}</p>
                  </div>
                  <button
                    onClick={() => removeLink(i)}
                    className="p-2 active:opacity-60"
                  >
                    <Trash2 size={16} className="text-[#ed4956]" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="h-6" />
        </Sheet>
      )}

      {/* Add link sheet */}
      {activeSheet === "addLink" && (
        <Sheet onClose={() => setActiveSheet("links")}>
          <div className="px-4 pb-2 pt-1 flex items-center justify-between">
            <button onClick={() => setActiveSheet("links")}>
              <ChevronLeft size={24} className="text-white" />
            </button>
            <h2 className="text-[17px] font-semibold">Add link</h2>
            <button
              onClick={addLink}
              disabled={!newLink.url}
              className="text-[#0095f6] text-[15px] font-semibold disabled:opacity-40"
            >
              Done
            </button>
          </div>
          <div className="px-4 py-4 flex flex-col gap-4">
            <div className="bg-[#262626] rounded-2xl overflow-hidden border border-[#3e3e3e]">
              <div className="px-4 py-3">
                <label className="block text-[11px] text-[#8e8e8e] uppercase tracking-wider mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={newLink.url}
                  onChange={(e) =>
                    setNewLink((p) => ({ ...p, url: e.target.value }))
                  }
                  placeholder="https://"
                  className="w-full bg-transparent text-white text-[15px] outline-none placeholder:text-[#4e4e4e]"
                  autoFocus
                />
              </div>
              <div className="h-px bg-[#3e3e3e]" />
              <div className="px-4 py-3">
                <label className="block text-[11px] text-[#8e8e8e] uppercase tracking-wider mb-1">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={newLink.title}
                  onChange={(e) =>
                    setNewLink((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="Link title"
                  className="w-full bg-transparent text-white text-[15px] outline-none placeholder:text-[#4e4e4e]"
                />
              </div>
            </div>
          </div>
          <div className="h-6" />
        </Sheet>
      )}
    </div>
  );
}