"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  User,
  Lock,
  Bell,
  Palette,
  Shield,
  ChevronRight,
  ChevronLeft,
  Camera,
  Check,
  X,
  Globe,
  Eye,
  EyeOff,
  Trash2,
  LogOut,
  Moon,
  Sun,
  Monitor,
  Link as LinkIcon,
  Plus,
} from "lucide-react";

/*Types*/
type Section =
  | "home"
  | "account"
  | "privacy"
  | "notifications"
  | "appearance"
  | "security";

interface ProfileForm {
  fullName: string;
  username: string;
  bio: string;
  website: string;
  pronouns: string;
  gender: string;
  customGender: string;
  links: { title: string; url: string }[];
}

interface PrivacyForm {
  isPrivate: boolean;
  showActivityStatus: boolean;
  allowStoryResharing: boolean;
  allowTagging: boolean;
  allowDMs: "everyone" | "followers" | "none";
}

interface NotifForm {
  likes: boolean;
  comments: boolean;
  follows: boolean;
  mentions: boolean;
  stories: boolean;
  emailDigest: boolean;
  pushEnabled: boolean;
}
type Theme = "dark" | "light" | "system";
type FontSize = "sm" | "md" | "lg";

interface AppearanceForm {
  theme: Theme;
  language: string;
  fontSize: FontSize;
}


const PRONOUNS = [
  "Prefer not to say",
  "he/him",
  "she/her",
  "they/them",
  "he/they",
  "she/they",
];
const GENDERS = ["Prefer not to say", "Male", "Female", "Non-binary", "Custom"];
const LANGUAGES = [
  "English",
  "Hindi",
  "Spanish",
  "French",
  "German",
  "Japanese",
  "Portuguese",
];

const THEME_COLORS: Record<
  Theme,
  {
    bg: string;
    card: string;
    border: string;
    text: string;
    sub: string;
    input: string;
  }
> = {
  dark: {
    bg: "#000",
    card: "#0d0d0d",
    border: "#1f1f1f",
    text: "#fff",
    sub: "#666",
    input: "#1a1a1a",
  },
  light: {
    bg: "#f5f5f5",
    card: "#fff",
    border: "#e5e5e5",
    text: "#111",
    sub: "#888",
    input: "#f0f0f0",
  },
  system: {
    bg: "#000",
    card: "#0d0d0d",
    border: "#1f1f1f",
    text: "#fff",
    sub: "#666",
    input: "#1a1a1a",
  },
};


function Toggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{ background: on ? "#0095f6" : "#3a3a3a" }}
      className="relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0"
    >
      <span
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200"
        style={{ left: on ? "22px" : "2px" }}
      />
    </button>
  );
}
export default function SettingsPage() {
  const { data: session, update, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [section, setSection] = useState<Section>("home");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<"idle" | "success" | "error">("idle");

  /* Profile state  */
  const [profile, setProfile] = useState<ProfileForm>({
    fullName: "",
    username: "",
    bio: "",
    website: "",
    pronouns: "Prefer not to say",
    gender: "Prefer not to say",
    customGender: "",
    links: [],
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [newLink, setNewLink] = useState({ title: "", url: "" });
  const [showAddLink, setShowAddLink] = useState(false);

  /*  Privacy state */
  const [privacy, setPrivacy] = useState<PrivacyForm>({
    isPrivate: false,
    showActivityStatus: true,
    allowStoryResharing: true,
    allowTagging: true,
    allowDMs: "everyone",
  });

  /*  Notifications state  */
  const [notif, setNotif] = useState<NotifForm>({
    likes: true,
    comments: true,
    follows: true,
    mentions: true,
    stories: false,
    emailDigest: false,
    pushEnabled: true,
  });

  /* Appearance state */
  const [appearance, setAppearance] = useState<AppearanceForm>({
    theme: "dark",
    language: "English",
    fontSize: "md",
  });

  /* Password state  */
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [showPw, setShowPw] = useState(false);

  const c = THEME_COLORS[appearance.theme];

  // Load profile 
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user?.username) {
      router.push("/login");
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/users/${session.user.username}`);
        if (!res.ok) return;
        const d = await res.json();
        setProfile({
          fullName: d.fullName ?? "",
          username: d.username ?? "",
          bio: d.bio ?? "",
          website: d.website ?? "",
          pronouns: d.pronouns ?? "Prefer not to say",
          gender: d.gender ?? "Prefer not to say",
          customGender: d.customGender ?? "",
          links: Array.isArray(d.links)
            ? d.links
            : typeof d.links === "string"
              ? JSON.parse(d.links)
              : [],
        });
        if (d.avatarUrl) setAvatarPreview(d.avatarUrl);
        if (d.isPrivate !== undefined)
          setPrivacy((p) => ({ ...p, isPrivate: d.isPrivate }));
      } catch (e) {
        console.error(e);
      }
    })();
  }, [session?.user?.username, status, router]);

  const flash = (msg: "success" | "error") => {
    setSaveMsg(msg);
    setTimeout(() => setSaveMsg("idle"), 2500);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("fullName", profile.fullName);
      fd.append("username", profile.username);
      fd.append("bio", profile.bio);
      fd.append("website", profile.website);
      fd.append("pronouns", profile.pronouns);
      fd.append(
        "gender",
        profile.gender === "Custom" ? profile.customGender : profile.gender,
      );
      fd.append("links", JSON.stringify(profile.links));
      if (avatarFile) fd.append("avatar", avatarFile);
      const res = await fetch(`/api/users/${session?.user?.username}`, {
        method: "PATCH",
        body: fd,
      });
      if (!res.ok) throw new Error();
      await update({ username: profile.username });
      flash("success");
    } catch {
      flash("error");
    } finally {
      setSaving(false);
    }
  };

  const savePrivacy = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("isPrivate", String(privacy.isPrivate));
      fd.append("showActivityStatus", String(privacy.showActivityStatus));
      fd.append("allowStoryResharing", String(privacy.allowStoryResharing));
      fd.append("allowTagging", String(privacy.allowTagging));
      fd.append("allowDMs", privacy.allowDMs);
      const res = await fetch(`/api/users/${session?.user?.username}`, {
        method: "PATCH",
        body: fd,
      });
      if (!res.ok) throw new Error();
      flash("success");
    } catch {
      flash("error");
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    if (passwords.next !== passwords.confirm) {
      flash("error");
      return;
    }
    setSaving(true);
    try {
      await fetch(`/api/users/${session?.user?.username}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.next,
        }),
      });
      flash("success");
      setPasswords({ current: "", next: "", confirm: "" });
    } catch {
      flash("error");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };


  const Divider = () => (
    <div style={{ background: c.border, height: 1, margin: "0 16px" }} />
  );

  const Row = ({
    label,
    sub,
    right,
  }: {
    label: string;
    sub?: string;
    right: React.ReactNode;
  }) => (
    <div className="flex items-center justify-between px-4 py-4">
      <div className="flex-1 pr-4">
        <p style={{ color: c.text }} className="text-[15px]">
          {label}
        </p>
        {sub && (
          <p style={{ color: c.sub }} className="text-[12px] mt-0.5">
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );

  const Field = ({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    maxLength,
    multiline,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    maxLength?: number;
    multiline?: boolean;
  }) => (
    <div className="px-4 py-3">
      <label
        style={{ color: c.sub }}
        className="block text-[11px] uppercase tracking-widest mb-1.5"
      >
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          maxLength={maxLength}
          style={{ color: c.text, background: "transparent" }}
          className="w-full text-[15px] outline-none resize-none placeholder:opacity-30"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          style={{ color: c.text, background: "transparent" }}
          className="w-full text-[15px] outline-none placeholder:opacity-30"
        />
      )}
      {maxLength && (
        <p
          style={{ color: c.sub }}
          className="text-[11px] text-right mt-1 opacity-50"
        >
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );

  const Card = ({ children }: { children: React.ReactNode }) => (
    <div
      style={{ background: c.card, border: `1px solid ${c.border}` }}
      className="mx-4 rounded-2xl overflow-hidden"
    >
      {children}
    </div>
  );

  const SectionLabel = ({ text }: { text: string }) => (
    <p
      style={{ color: c.sub }}
      className="px-4 pt-5 pb-2 text-[11px] font-semibold uppercase tracking-widest"
    >
      {text}
    </p>
  );

  const SaveButton = ({ onPress }: { onPress: () => void }) => (
    <div className="px-4 mt-6 pb-2">
      <button
        onClick={onPress}
        disabled={saving}
        className="w-full bg-[#0095f6] text-white text-[15px] font-semibold py-3.5 rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving ? (
          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : saveMsg === "success" ? (
          <>
            <Check size={18} /> Saved
          </>
        ) : saveMsg === "error" ? (
          "Try again"
        ) : (
          "Save changes"
        )}
      </button>
    </div>
  );

  const TopBar = ({
    title,
    onSave,
  }: {
    title: string;
    onSave?: () => void;
  }) => (
    <div
      style={{ background: c.bg, borderBottom: `1px solid ${c.border}` }}
      className="sticky top-0 z-40 flex items-center justify-between px-4 py-3"
    >
      <button onClick={() => setSection("home")} className="p-1">
        <ChevronLeft size={24} style={{ color: c.text }} />
      </button>
      <h1 style={{ color: c.text }} className="text-[17px] font-semibold">
        {title}
      </h1>
      {onSave ? (
        <button
          onClick={onSave}
          disabled={saving}
          className="text-[#0095f6] text-[15px] font-semibold disabled:opacity-40"
        >
          {saving ? "…" : saveMsg === "success" ? "✓" : "Save"}
        </button>
      ) : (
        <div className="w-10" />
      )}
    </div>
  );

  if (status === "loading")
    return (
      <main className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-7 h-7 border-2 border-neutral-800 border-t-white rounded-full animate-spin" />
      </main>
    );

  /* Homemenu list */
  if (section === "home") {
    const items: {
      id: Section;
      icon: React.ReactNode;
      label: string;
      sub: string;
    }[] = [
      {
        id: "account",
        icon: <User size={18} />,
        label: "Account",
        sub: "Profile, username, bio",
      },
      {
        id: "privacy",
        icon: <Lock size={18} />,
        label: "Privacy",
        sub: "Visibility, DMs, tagging",
      },
      {
        id: "notifications",
        icon: <Bell size={18} />,
        label: "Notifications",
        sub: "Push, email alerts",
      },
      {
        id: "appearance",
        icon: <Palette size={18} />,
        label: "Appearance",
        sub: "Theme, language",
      },
      {
        id: "security",
        icon: <Shield size={18} />,
        label: "Security",
        sub: "Password, sessions",
      },
    ];

    return (
      <main
        style={{ background: c.bg }}
        className="max-w-md mx-auto min-h-screen pb-24"
      >
        {/* Top bar */}
        <div
          style={{ background: c.bg, borderBottom: `1px solid ${c.border}` }}
          className="sticky top-0 z-40 flex items-center justify-between px-4 py-3"
        >
          <button onClick={() => router.back()} className="p-1">
            <ChevronLeft size={24} style={{ color: c.text }} />
          </button>
          <h1 style={{ color: c.text }} className="text-[17px] font-semibold">
            Settings
          </h1>
          <div className="w-8" />
        </div>

        {/* Avatar preview */}
        <div className="flex flex-col items-center pt-8 pb-6">
          <div
            style={{ border: `2px solid ${c.border}` }}
            className="w-20 h-20 rounded-full overflow-hidden mb-3"
          >
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt="avatar"
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            ) : (
              <div
                style={{ background: c.input, color: c.text }}
                className="w-full h-full flex items-center justify-center text-3xl font-light"
              >
                {profile.username[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <p style={{ color: c.text }} className="text-[16px] font-semibold">
            {profile.fullName || profile.username}
          </p>
          <p style={{ color: c.sub }} className="text-[13px] mt-0.5">
            @{profile.username}
          </p>
        </div>

        {/* Menu */}
        <SectionLabel text="Manage" />
        <Card>
          {items.map((item, i) => (
            <div key={item.id}>
              <button
                onClick={() => setSection(item.id)}
                className="w-full flex items-center gap-4 px-4 py-4 active:opacity-60 transition-opacity"
              >
                <div
                  style={{ background: c.input, color: c.sub }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                >
                  {item.icon}
                </div>
                <div className="flex-1 text-left">
                  <p
                    style={{ color: c.text }}
                    className="text-[15px] font-medium"
                  >
                    {item.label}
                  </p>
                  <p style={{ color: c.sub }} className="text-[12px] mt-0.5">
                    {item.sub}
                  </p>
                </div>
                <ChevronRight size={16} style={{ color: c.border }} />
              </button>
              {i < items.length - 1 && <Divider />}
            </div>
          ))}
        </Card>

        {/* account actions */}
        <SectionLabel text="Account" />
        <Card>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-4 px-4 py-4 active:opacity-60 transition-opacity"
          >
            <div
              style={{ background: c.input }}
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            >
              <LogOut size={18} style={{ color: c.sub }} />
            </div>
            <p style={{ color: c.text }} className="text-[15px] font-medium">
              Log out
            </p>
          </button>
          <Divider />
          <button className="w-full flex items-center gap-4 px-4 py-4 active:opacity-60 transition-opacity">
            <div
              style={{ background: c.input }}
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            >
              <Trash2 size={18} className="text-[#ed4956]" />
            </div>
            <p className="text-[15px] font-medium text-[#ed4956]">
              Delete account
            </p>
          </button>
        </Card>
      </main>
    );
  }

  if (section === "account")
    return (
      <main
        style={{ background: c.bg }}
        className="max-w-md mx-auto min-h-screen pb-24"
      >
        <TopBar title="Account" onSave={saveProfile} />

        {/* Avatar */}
        <div
          style={{ borderBottom: `1px solid ${c.border}` }}
          className="flex flex-col items-center py-6"
        >
          <div
            className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {avatarPreview ? (
              <Image src={avatarPreview} alt="avatar" fill className="object-cover" />
            ) : (
              <div
                style={{ background: c.input, color: c.text }}
                className="w-full h-full flex items-center justify-center text-4xl font-light"
              >
                {profile.username[0]?.toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Camera size={22} className="text-white" />
            </div>
          </div>
          <div className="flex gap-4 mt-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[#0095f6] text-[14px] font-semibold"
            >
              Change photo
            </button>
            {avatarPreview && (
              <button
                onClick={() => {
                  setAvatarFile(null);
                  setAvatarPreview(null);
                }}
                className="text-[#ed4956] text-[14px] font-semibold"
              >
                Remove
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatar}
          />
        </div>

        <SectionLabel text="Personal info" />
        <Card>
          <Field
            label="Full name"
            value={profile.fullName}
            onChange={(v) => setProfile((p) => ({ ...p, fullName: v }))}
            placeholder="Your name"
          />
          <Divider />
          <Field
            label="Username"
            value={profile.username}
            onChange={(v) => setProfile((p) => ({ ...p, username: v }))}
            placeholder="username"
          />
          <Divider />
          <Field
            label="Bio"
            value={profile.bio}
            onChange={(v) => setProfile((p) => ({ ...p, bio: v }))}
            placeholder="Tell people about yourself"
            maxLength={150}
            multiline
          />
          <Divider />
          <div className="px-4 py-3">
            <label
              style={{ color: c.sub }}
              className="block text-[11px] uppercase tracking-widest mb-1.5"
            >
              Pronouns
            </label>
            <select
              value={profile.pronouns}
              onChange={(e) =>
                setProfile((p) => ({ ...p, pronouns: e.target.value }))
              }
              style={{ color: c.text, background: "transparent" }}
              className="w-full text-[15px] outline-none"
            >
              {PRONOUNS.map((o) => (
                <option key={o} value={o} style={{ background: c.card }}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <Divider />
          <div className="px-4 py-3">
            <label
              style={{ color: c.sub }}
              className="block text-[11px] uppercase tracking-widest mb-1.5"
            >
              Gender
            </label>
            <select
              value={profile.gender}
              onChange={(e) =>
                setProfile((p) => ({ ...p, gender: e.target.value }))
              }
              style={{ color: c.text, background: "transparent" }}
              className="w-full text-[15px] outline-none"
            >
              {GENDERS.map((o) => (
                <option key={o} value={o} style={{ background: c.card }}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          {profile.gender === "Custom" && (
            <>
              <Divider />
              <Field
                label="Custom gender"
                value={profile.customGender}
                onChange={(v) => setProfile((p) => ({ ...p, customGender: v }))}
                placeholder="Enter your gender"
              />
            </>
          )}
        </Card>

        <SectionLabel text="Website & links" />
        <Card>
          <Field
            label="Website"
            value={profile.website}
            onChange={(v) => setProfile((p) => ({ ...p, website: v }))}
            placeholder="https://"
            type="url"
          />
          {profile.links.length > 0 && <Divider />}
          {profile.links.map((link, i) => (
            <div key={i}>
              <div className="flex items-center gap-3 px-4 py-3">
                <LinkIcon
                  size={15}
                  style={{ color: c.sub }}
                  className="shrink-0"
                />
                <div className="flex-1 min-w-0">
                  {link.title && (
                    <p
                      style={{ color: c.text }}
                      className="text-[13px] font-semibold truncate"
                    >
                      {link.title}
                    </p>
                  )}
                  <p className="text-[13px] text-[#0095f6] truncate">{link.url}</p>
                </div>
                <button
                  onClick={() =>
                    setProfile((p) => ({
                      ...p,
                      links: p.links.filter((_, idx) => idx !== i),
                    }))
                  }
                  className="p-1.5"
                >
                  <X size={15} className="text-[#ed4956]" />
                </button>
              </div>
              <Divider />
            </div>
          ))}

          {showAddLink ? (
            <div className="px-4 py-3 flex flex-col gap-3">
              <input
                type="url"
                value={newLink.url}
                onChange={(e) =>
                  setNewLink((p) => ({ ...p, url: e.target.value }))
                }
                placeholder="https://"
                autoFocus
                style={{
                  background: c.input,
                  color: c.text,
                  border: `1px solid ${c.border}`,
                }}
                className="w-full rounded-xl px-3 py-2.5 text-[14px] outline-none placeholder:opacity-30"
              />
              <input
                type="text"
                value={newLink.title}
                onChange={(e) =>
                  setNewLink((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="Title (optional)"
                style={{
                  background: c.input,
                  color: c.text,
                  border: `1px solid ${c.border}`,
                }}
                className="w-full rounded-xl px-3 py-2.5 text-[14px] outline-none placeholder:opacity-30"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (newLink.url) {
                      setProfile((p) => ({
                        ...p,
                        links: [...p.links, { ...newLink }],
                      }));
                      setNewLink({ title: "", url: "" });
                    }
                    setShowAddLink(false);
                  }}
                  className="flex-1 bg-[#0095f6] text-white text-[14px] font-semibold py-2.5 rounded-xl"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddLink(false)}
                  style={{ background: c.input, color: c.text }}
                  className="flex-1 text-[14px] font-semibold py-2.5 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddLink(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 active:opacity-60 transition-opacity"
            >
              <Plus size={17} className="text-[#0095f6]" />
              <span className="text-[15px] text-[#0095f6] font-semibold">
                Add link
              </span>
            </button>
          )}
        </Card>
        <SaveButton onPress={saveProfile} />
      </main>
    );

  if (section === "privacy")
    return (
      <main
        style={{ background: c.bg }}
        className="max-w-md mx-auto min-h-screen pb-24"
      >
        <TopBar title="Privacy" onSave={savePrivacy} />

        <SectionLabel text="Account" />
        <Card>
          <Row
            label="Private account"
            sub="Only followers see your posts"
            right={
              <Toggle
                on={privacy.isPrivate}
                onChange={(v) => setPrivacy((p) => ({ ...p, isPrivate: v }))}
              />
            }
          />
          <Divider />
          <Row
            label="Activity status"
            sub="Show when you were last active"
            right={
              <Toggle
                on={privacy.showActivityStatus}
                onChange={(v) =>
                  setPrivacy((p) => ({ ...p, showActivityStatus: v }))
                }
              />
            }
          />
          <Divider />
          <Row
            label="Story resharing"
            sub="Let others share your stories"
            right={
              <Toggle
                on={privacy.allowStoryResharing}
                onChange={(v) =>
                  setPrivacy((p) => ({ ...p, allowStoryResharing: v }))
                }
              />
            }
          />
          <Divider />
          <Row
            label="Allow tagging"
            sub="Let others tag you in posts"
            right={
              <Toggle
                on={privacy.allowTagging}
                onChange={(v) => setPrivacy((p) => ({ ...p, allowTagging: v }))}
              />
            }
          />
        </Card>

        <SectionLabel text="Messages" />
        <Card>
          <div className="px-4 py-3">
            <p
              style={{ color: c.sub }}
              className="text-[12px] uppercase tracking-widest mb-3"
            >
              Who can DM you
            </p>
            {(["everyone", "followers", "none"] as const).map((opt, i, arr) => (
              <div key={opt}>
                <button
                  onClick={() => setPrivacy((p) => ({ ...p, allowDMs: opt }))}
                  className="w-full flex items-center justify-between py-3"
                >
                  <span style={{ color: c.text }} className="text-[15px]">
                    {opt === "none" ? "No one" : opt[0].toUpperCase() + opt.slice(1)}
                  </span>
                  {privacy.allowDMs === opt && (
                    <Check size={16} className="text-[#0095f6]" />
                  )}
                </button>
                {i < arr.length - 1 && <Divider />}
              </div>
            ))}
          </div>
        </Card>
        <SaveButton onPress={savePrivacy} />
      </main>
    );

  /* NOTIFICATIONS */
  if (section === "notifications") {
    const rows: { label: string; sub: string; field: keyof NotifForm }[] = [
      { label: "Likes", sub: "When someone likes your post", field: "likes" },
      { label: "Comments", sub: "When someone comments", field: "comments" },
      {
        label: "New followers",
        sub: "When someone follows you",
        field: "follows",
      },
      {
        label: "Mentions",
        sub: "When someone mentions you",
        field: "mentions",
      },
      {
        label: "Stories",
        sub: "When someone views your story",
        field: "stories",
      },
      {
        label: "Email digest",
        sub: "Weekly summary of your activity",
        field: "emailDigest",
      },
    ];
    return (
      <main
        style={{ background: c.bg }}
        className="max-w-md mx-auto min-h-screen pb-24"
      >
        <TopBar title="Notifications" />
        <SectionLabel text="Push" />
        <Card>
          <Row
            label="Enable push notifications"
            sub="Master toggle for all alerts"
            right={
              <Toggle
                on={notif.pushEnabled}
                onChange={(v) => setNotif((p) => ({ ...p, pushEnabled: v }))}
              />
            }
          />
        </Card>
        <SectionLabel text="Activity" />
        <Card>
          {rows.map((r, i) => (
            <div key={r.field}>
              <Row
                label={r.label}
                sub={r.sub}
                right={
                  <Toggle
                    on={notif[r.field]}
                    onChange={(v) => setNotif((p) => ({ ...p, [r.field]: v }))}
                  />
                }
              />
              {i < rows.length - 1 && <Divider />}
            </div>
          ))}
        </Card>
        <SaveButton onPress={() => flash("success")} />
      </main>
    );
  }

  if (section === "appearance") {
    const themes: { id: Theme; label: string; icon: React.ReactNode }[] = [
      { id: "dark", label: "Dark", icon: <Moon size={18} /> },
      { id: "light", label: "Light", icon: <Sun size={18} /> },
      { id: "system", label: "System", icon: <Monitor size={18} /> },
    ];
    const fontSizes: { id: FontSize; label: string }[] = [
      { id: "sm", label: "Small" },
      { id: "md", label: "Default" },
      { id: "lg", label: "Large" },
    ];
    return (
      <main
        style={{ background: c.bg }}
        className="max-w-md mx-auto min-h-screen pb-24"
      >
        <TopBar title="Appearance" />

        <SectionLabel text="Theme" />
        <Card>
          <div className="p-4 flex gap-3">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setAppearance((p) => ({ ...p, theme: t.id }))}
                style={{
                  border: `1px solid ${appearance.theme === t.id ? "#0095f6" : c.border}`,
                  background:
                    appearance.theme === t.id ? "rgba(0,149,246,0.1)" : c.input,
                }}
                className="flex-1 flex flex-col items-center gap-2 py-4 rounded-xl transition-all"
              >
                <span
                  style={{
                    color: appearance.theme === t.id ? "#0095f6" : c.sub,
                  }}
                >
                  {t.icon}
                </span>
                <span
                  style={{
                    color: appearance.theme === t.id ? "#0095f6" : c.sub,
                  }}
                  className="text-[13px] font-medium"
                >
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </Card>

        <SectionLabel text="Font size" />
        <Card>
          <div className="p-4 flex gap-3">
            {fontSizes.map((f) => (
              <button
                key={f.id}
                onClick={() => setAppearance((p) => ({ ...p, fontSize: f.id }))}
                style={{
                  border: `1px solid ${appearance.fontSize === f.id ? "#0095f6" : c.border}`,
                  background:
                    appearance.fontSize === f.id
                      ? "rgba(0,149,246,0.1)"
                      : c.input,
                  color: appearance.fontSize === f.id ? "#0095f6" : c.sub,
                }}
                className="flex-1 py-3 rounded-xl text-[14px] font-medium transition-all"
              >
                {f.label}
              </button>
            ))}
          </div>
        </Card>

        <SectionLabel text="Language" />
        <Card>
          <div className="px-4 py-3">
            <select
              value={appearance.language}
              onChange={(e) =>
                setAppearance((p) => ({ ...p, language: e.target.value }))
              }
              style={{ color: c.text, background: "transparent" }}
              className="w-full text-[15px] outline-none"
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l} style={{ background: c.card }}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </Card>
        <SaveButton onPress={() => flash("success")} />
      </main>
    );
  }


  if (section === "security")
    return (
      <main
        style={{ background: c.bg }}
        className="max-w-md mx-auto min-h-screen pb-24"
      >
        <TopBar title="Security" onSave={savePassword} />

        <SectionLabel text="Change password" />
        <Card>
          {[
            { key: "current" as const, label: "Current password" },
            { key: "next" as const, label: "New password" },
            { key: "confirm" as const, label: "Confirm new password" },
          ].map((f, i, arr) => (
            <div key={f.key}>
              <div className="px-4 py-3">
                <label
                  style={{ color: c.sub }}
                  className="block text-[11px] uppercase tracking-widest mb-1.5"
                >
                  {f.label}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type={showPw ? "text" : "password"}
                    value={passwords[f.key]}
                    onChange={(e) =>
                      setPasswords((p) => ({ ...p, [f.key]: e.target.value }))
                    }
                    placeholder="••••••••"
                    style={{ color: c.text, background: "transparent" }}
                    className="flex-1 text-[15px] outline-none placeholder:opacity-30"
                  />
                  {f.key === "current" && (
                    <button
                      onClick={() => setShowPw((s) => !s)}
                      style={{ color: c.sub }}
                    >
                      {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  )}
                </div>
              </div>
              {i < arr.length - 1 && <Divider />}
            </div>
          ))}
          {passwords.next &&
            passwords.confirm &&
            passwords.next !== passwords.confirm && (
              <p className="px-4 pb-3 text-[#ed4956] text-[12px]">
                Passwords do not match
              </p>
            )}
        </Card>

        <SectionLabel text="Sessions" />
        <Card>
          <Row
            label="Active sessions"
            sub="This device · Last active now"
            right={<Globe size={16} style={{ color: c.sub }} />}
          />
          <Divider />
          <button className="w-full px-4 py-4 text-left active:opacity-60 transition-opacity">
            <p className="text-[15px] text-[#ed4956]">
              Log out all other devices
            </p>
          </button>
        </Card>
        <SaveButton onPress={savePassword} />
      </main>
    );

  return null;
}