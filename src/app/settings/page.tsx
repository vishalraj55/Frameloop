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

interface AppearanceForm {
  theme: "dark" | "light" | "system";
  language: string;
  fontSize: "sm" | "md" | "lg";
}

const PRONOUNS_OPTIONS = [
  "Prefer not to say",
  "he/him",
  "she/her",
  "they/them",
  "he/they",
  "she/they",
];

const GENDER_OPTIONS = [
  "Prefer not to say",
  "Male",
  "Female",
  "Non-binary",
  "Custom",
];

const LANGUAGES = [
  "English",
  "Hindi",
  "Spanish",
  "French",
  "German",
  "Japanese",
  "Portuguese",
];

/* Reusable primitives */
const Divider = () => <div className="h-px bg-[#1f1f1f] mx-4" />;

const Toggle = ({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
}) => (
  <button
    onClick={() => onChange(!on)}
    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
      on ? "bg-[#0095f6]" : "bg-[#3a3a3a]"
    }`}
  >
    <span
      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${
        on ? "left-5.5" : "left-0.5"
      }`}
    />
  </button>
);

const SectionCard = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <div className="bg-[#0d0d0d] mx-4 rounded-2xl overflow-hidden border border-[#1f1f1f]">
    {children}
  </div>
);

const Label = ({ text }: { text: string }) => (
  <p className="px-4 pt-5 pb-2 text-[11px] font-semibold text-[#5e5e5e] uppercase tracking-widest">
    {text}
  </p>
);

/* Main Page  */
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

  /* ── Appearance state ── */
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

  /* Fetch profile */
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user?.username) {
      router.push("/login");
      return;
    }
    const load = async () => {
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
          links: d.links ?? [],
        });
        if (d.avatarUrl) setAvatarPreview(d.avatarUrl);
        if (d.isPrivate !== undefined)
          setPrivacy((p) => ({ ...p, isPrivate: d.isPrivate }));
      } catch (e) {
        console.error(e);
      }
    };
    void load();
  }, [session?.user?.username, status, router]);

  /* Save handlers */
  const saveProfile = async () => {
    setSaving(true);
    setSaveMsg("idle");
    try {
      const fd = new FormData();
      fd.append("fullName", profile.fullName);
      fd.append("username", profile.username);
      fd.append("bio", profile.bio);
      fd.append("website", profile.website);
      fd.append("pronouns", profile.pronouns);
      fd.append(
        "gender",
        profile.gender === "Custom" ? profile.customGender : profile.gender
      );
      fd.append("links", JSON.stringify(profile.links));
      if (avatarFile) fd.append("avatar", avatarFile);

      const res = await fetch(`/api/users/${session?.user?.username}`, {
        method: "PATCH",
        body: fd,
      });
      if (!res.ok) throw new Error();
      await update({ username: profile.username });
      setSaveMsg("success");
    } catch {
      setSaveMsg("error");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg("idle"), 2500);
    }
  };

  const savePrivacy = async () => {
    setSaving(true);
    try {
      await fetch(`/api/users/${session?.user?.username}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(privacy),
      });
      setSaveMsg("success");
    } catch {
      setSaveMsg("error");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg("idle"), 2500);
    }
  };

  const savePassword = async () => {
    if (passwords.next !== passwords.confirm) {
      setSaveMsg("error");
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
      setSaveMsg("success");
      setPasswords({ current: "", next: "", confirm: "" });
    } catch {
      setSaveMsg("error");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg("idle"), 2500);
    }
  };

  /* ── Avatar helpers ── */
  function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  /* ── Back button ── */
  const back = () => setSection("home");

  if (status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#080808]">
        <div className="w-8 h-8 border-2 border-[#2a2a2a] border-t-white rounded-full animate-spin" />
      </main>
    );
  }

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
        icon: <User size={20} />,
        label: "Account",
        sub: "Profile, username, bio, links",
      },
      {
        id: "privacy",
        icon: <Lock size={20} />,
        label: "Privacy",
        sub: "Account visibility, DMs, tagging",
      },
      {
        id: "notifications",
        icon: <Bell size={20} />,
        label: "Notifications",
        sub: "Push, email, activity alerts",
      },
      {
        id: "appearance",
        icon: <Palette size={20} />,
        label: "Appearance",
        sub: "Theme, language, font size",
      },
      {
        id: "security",
        icon: <Shield size={20} />,
        label: "Security",
        sub: "Password, connected apps",
      },
    ];

    return (
      <main className="max-w-md mx-auto bg-[#080808] min-h-screen text-white pb-24">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-[#080808] border-b border-[#1a1a1a]">
          <button onClick={() => router.back()} className="p-1">
            <ChevronLeft size={24} className="text-white" />
          </button>
          <h1 className="text-[17px] font-semibold tracking-tight">Settings</h1>
          <div className="w-8" />
        </div>

        {/* Avatar preview */}
        <div className="flex flex-col items-center pt-8 pb-6">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#2a2a2a] mb-3">
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt="avatar"
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center text-3xl text-white font-light">
                {profile.username[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <p className="text-[16px] font-semibold">{profile.fullName || profile.username}</p>
          <p className="text-[13px] text-[#6e6e6e] mt-0.5">@{profile.username}</p>
        </div>

        {/* Menu */}
        <Label text="Manage" />
        <SectionCard>
          {items.map((item, i) => (
            <div key={item.id}>
              <button
                onClick={() => setSection(item.id)}
                className="w-full flex items-center gap-4 px-4 py-4 active:bg-[#151515] transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-[#1a1a1a] flex items-center justify-center text-[#8e8e8e] shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[15px] text-white font-medium">{item.label}</p>
                  <p className="text-[12px] text-[#5e5e5e] mt-0.5">{item.sub}</p>
                </div>
                <ChevronRight size={16} className="text-[#3e3e3e]" />
              </button>
              {i < items.length - 1 && <Divider />}
            </div>
          ))}
        </SectionCard>

        {/* Danger + logout */}
        <Label text="Account" />
        <SectionCard>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-4 px-4 py-4 active:bg-[#151515] transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-[#1a1a1a] flex items-center justify-center shrink-0">
              <LogOut size={20} className="text-[#8e8e8e]" />
            </div>
            <p className="text-[15px] text-white font-medium">Log out</p>
          </button>
          <Divider />
          <button className="w-full flex items-center gap-4 px-4 py-4 active:bg-[#151515] transition-colors">
            <div className="w-9 h-9 rounded-xl bg-[#1a1a1a] flex items-center justify-center shrink-0">
              <Trash2 size={20} className="text-[#ed4956]" />
            </div>
            <p className="text-[15px] text-[#ed4956] font-medium">Delete account</p>
          </button>
        </SectionCard>
      </main>
    );
  }

  /*Shared top bar for sub-sections*/
  const SubTopBar = ({ title, onSave }: { title: string; onSave?: () => void }) => (
    <div className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-[#080808] border-b border-[#1a1a1a]">
      <button onClick={back} className="p-1">
        <ChevronLeft size={24} className="text-white" />
      </button>
      <h1 className="text-[17px] font-semibold tracking-tight">{title}</h1>
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

  /* Input field */
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
      <label className="block text-[11px] text-[#5e5e5e] uppercase tracking-widest mb-1.5">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          maxLength={maxLength}
          className="w-full bg-transparent text-white text-[15px] outline-none resize-none placeholder:text-[#3e3e3e]"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full bg-transparent text-white text-[15px] outline-none placeholder:text-[#3e3e3e]"
        />
      )}
      {maxLength && (
        <p className="text-[11px] text-[#3e3e3e] text-right mt-1">
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );

  /* ACCOUNT */
  if (section === "account") {
    return (
      <main className="max-w-md mx-auto bg-[#080808] min-h-screen text-white pb-24">
        <SubTopBar title="Account" onSave={saveProfile} />

        {/* Avatar */}
        <div className="flex flex-col items-center py-6 border-b border-[#1a1a1a]">
          <div
            className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {avatarPreview ? (
              <Image src={avatarPreview} alt="avatar" fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center text-4xl font-light">
                {profile.username[0]?.toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Camera size={22} className="text-white" />
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

        {/* Fields */}
        <Label text="Personal info" />
        <SectionCard>
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
          {/* Pronouns */}
          <div className="px-4 py-3">
            <label className="block text-[11px] text-[#5e5e5e] uppercase tracking-widest mb-1.5">
              Pronouns
            </label>
            <select
              value={profile.pronouns}
              onChange={(e) =>
                setProfile((p) => ({ ...p, pronouns: e.target.value }))
              }
              className="w-full bg-transparent text-white text-[15px] outline-none"
            >
              {PRONOUNS_OPTIONS.map((o) => (
                <option key={o} value={o} className="bg-[#1a1a1a]">
                  {o}
                </option>
              ))}
            </select>
          </div>
          <Divider />
          {/* Gender */}
          <div className="px-4 py-3">
            <label className="block text-[11px] text-[#5e5e5e] uppercase tracking-widest mb-1.5">
              Gender
            </label>
            <select
              value={profile.gender}
              onChange={(e) =>
                setProfile((p) => ({ ...p, gender: e.target.value }))
              }
              className="w-full bg-transparent text-white text-[15px] outline-none"
            >
              {GENDER_OPTIONS.map((o) => (
                <option key={o} value={o} className="bg-[#1a1a1a]">
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
        </SectionCard>

        <Label text="Website & links" />
        <SectionCard>
          <Field
            label="Website"
            value={profile.website}
            onChange={(v) => setProfile((p) => ({ ...p, website: v }))}
            placeholder="https://"
            type="url"
          />
          <Divider />
          {/* Links list */}
          {profile.links.map((link, i) => (
            <div key={i}>
              <div className="flex items-center gap-3 px-4 py-3">
                <LinkIcon size={16} className="text-[#5e5e5e] shrink-0" />
                <div className="flex-1 min-w-0">
                  {link.title && (
                    <p className="text-[13px] font-semibold text-white truncate">
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
                  <X size={16} className="text-[#ed4956]" />
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
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-white text-[14px] outline-none placeholder:text-[#3e3e3e]"
                autoFocus
              />
              <input
                type="text"
                value={newLink.title}
                onChange={(e) =>
                  setNewLink((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="Title (optional)"
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-white text-[14px] outline-none placeholder:text-[#3e3e3e]"
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
                  className="flex-1 bg-[#1a1a1a] text-white text-[14px] font-semibold py-2.5 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddLink(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-[#151515] transition-colors"
            >
              <Plus size={18} className="text-[#0095f6]" />
              <span className="text-[15px] text-[#0095f6] font-semibold">
                Add link
              </span>
            </button>
          )}
        </SectionCard>

        {saveMsg === "error" && (
          <p className="text-[#ed4956] text-sm text-center mt-4">
            Something went wrong. Please try again.
          </p>
        )}

        <div className="px-4 mt-6">
          <button
            onClick={saveProfile}
            disabled={saving}
            className="w-full bg-[#0095f6] text-white text-[15px] font-semibold py-3.5 rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : saveMsg === "success" ? (
              <>
                <Check size={18} /> Saved
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </main>
    );
  }

  /*PRIVACY*/
  if (section === "privacy") {
    const PrivRow = ({
      label,
      sub,
      field,
    }: {
      label: string;
      sub?: string;
      field: keyof Pick<
        PrivacyForm,
        | "isPrivate"
        | "showActivityStatus"
        | "allowStoryResharing"
        | "allowTagging"
      >;
    }) => (
      <div className="px-4 py-4 flex items-center justify-between">
        <div className="flex-1 pr-4">
          <p className="text-[15px] text-white">{label}</p>
          {sub && <p className="text-[12px] text-[#5e5e5e] mt-0.5">{sub}</p>}
        </div>
        <Toggle
          on={privacy[field]}
          onChange={(v) => setPrivacy((p) => ({ ...p, [field]: v }))}
        />
      </div>
    );

    return (
      <main className="max-w-md mx-auto bg-[#080808] min-h-screen text-white pb-24">
        <SubTopBar title="Privacy" onSave={savePrivacy} />

        <Label text="Account" />
        <SectionCard>
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 pr-4">
              {privacy.isPrivate ? (
                <Lock size={18} className="text-[#5e5e5e] shrink-0" />
              ) : (
                <Globe size={18} className="text-[#5e5e5e] shrink-0" />
              )}
              <div>
                <p className="text-[15px] text-white">Private account</p>
                <p className="text-[12px] text-[#5e5e5e] mt-0.5">
                  Only followers see your posts
                </p>
              </div>
            </div>
            <Toggle
              on={privacy.isPrivate}
              onChange={(v) => setPrivacy((p) => ({ ...p, isPrivate: v }))}
            />
          </div>
          <Divider />
          <PrivRow
            label="Activity status"
            sub="Show when you were last active"
            field="showActivityStatus"
          />
          <Divider />
          <PrivRow
            label="Allow story resharing"
            sub="Let others share your stories"
            field="allowStoryResharing"
          />
          <Divider />
          <PrivRow
            label="Allow tagging"
            sub="Let others tag you in posts"
            field="allowTagging"
          />
        </SectionCard>

        <Label text="Messages" />
        <SectionCard>
          <div className="px-4 py-4">
            <p className="text-[15px] text-white mb-3">Who can send you DMs</p>
            {(["everyone", "followers", "none"] as const).map((opt, i, arr) => (
              <div key={opt}>
                <button
                  onClick={() => setPrivacy((p) => ({ ...p, allowDMs: opt }))}
                  className="w-full flex items-center justify-between py-2.5"
                >
                  <span className="text-[14px] text-[#c0c0c0] capitalize">
                    {opt === "none" ? "No one" : opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </span>
                  {privacy.allowDMs === opt && (
                    <Check size={16} className="text-[#0095f6]" />
                  )}
                </button>
                {i < arr.length - 1 && <div className="h-px bg-[#1f1f1f]" />}
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="px-4 mt-6">
          <button
            onClick={savePrivacy}
            disabled={saving}
            className="w-full bg-[#0095f6] text-white text-[15px] font-semibold py-3.5 rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : saveMsg === "success" ? (
              <>
                <Check size={18} /> Saved
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </main>
    );
  }

  /* NOTIFICATIONS */
  if (section === "notifications") {
    const NotifRow = ({
      label,
      sub,
      field,
    }: {
      label: string;
      sub?: string;
      field: keyof NotifForm;
    }) => (
      <div className="px-4 py-4 flex items-center justify-between">
        <div className="flex-1 pr-4">
          <p className="text-[15px] text-white">{label}</p>
          {sub && <p className="text-[12px] text-[#5e5e5e] mt-0.5">{sub}</p>}
        </div>
        <Toggle
          on={notif[field]}
          onChange={(v) => setNotif((p) => ({ ...p, [field]: v }))}
        />
      </div>
    );

    return (
      <main className="max-w-md mx-auto bg-[#080808] min-h-screen text-white pb-24">
        <SubTopBar title="Notifications" />

        <Label text="Push notifications" />
        <SectionCard>
          <NotifRow
            label="Enable push notifications"
            sub="Master toggle for all push alerts"
            field="pushEnabled"
          />
        </SectionCard>

        <Label text="Activity" />
        <SectionCard>
          <NotifRow label="Likes" sub="When someone likes your post" field="likes" />
          <Divider />
          <NotifRow label="Comments" sub="When someone comments" field="comments" />
          <Divider />
          <NotifRow label="New followers" sub="When someone follows you" field="follows" />
          <Divider />
          <NotifRow label="Mentions" sub="When someone mentions you" field="mentions" />
          <Divider />
          <NotifRow label="Stories" sub="When someone views your story" field="stories" />
        </SectionCard>

        <Label text="Email" />
        <SectionCard>
          <NotifRow
            label="Email digest"
            sub="Weekly summary of your activity"
            field="emailDigest"
          />
        </SectionCard>

        <div className="px-4 mt-6">
          <button
            onClick={() => {
              setSaveMsg("success");
              setTimeout(() => setSaveMsg("idle"), 2000);
            }}
            className="w-full bg-[#0095f6] text-white text-[15px] font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2"
          >
            {saveMsg === "success" ? (
              <>
                <Check size={18} /> Saved
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </main>
    );
  }

  /*APPEARANCE */
  if (section === "appearance") {
    const themes: { id: AppearanceForm["theme"]; label: string; icon: React.ReactNode }[] = [
      { id: "dark", label: "Dark", icon: <Moon size={18} /> },
      { id: "light", label: "Light", icon: <Sun size={18} /> },
      { id: "system", label: "System", icon: <Monitor size={18} /> },
    ];

    const fontSizes: { id: AppearanceForm["fontSize"]; label: string }[] = [
      { id: "sm", label: "Small" },
      { id: "md", label: "Default" },
      { id: "lg", label: "Large" },
    ];

    return (
      <main className="max-w-md mx-auto bg-[#080808] min-h-screen text-white pb-24">
        <SubTopBar title="Appearance" />

        <Label text="Theme" />
        <SectionCard>
          <div className="p-4 flex gap-3">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setAppearance((p) => ({ ...p, theme: t.id }))}
                className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border transition-all ${
                  appearance.theme === t.id
                    ? "border-[#0095f6] bg-[#0095f6]/10"
                    : "border-[#2a2a2a] bg-[#131313]"
                }`}
              >
                <span
                  className={
                    appearance.theme === t.id ? "text-[#0095f6]" : "text-[#6e6e6e]"
                  }
                >
                  {t.icon}
                </span>
                <span
                  className={`text-[13px] font-medium ${
                    appearance.theme === t.id ? "text-[#0095f6]" : "text-[#8e8e8e]"
                  }`}
                >
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </SectionCard>

        <Label text="Language" />
        <SectionCard>
          <div className="px-4 py-3">
            <label className="block text-[11px] text-[#5e5e5e] uppercase tracking-widest mb-1.5">
              Language
            </label>
            <select
              value={appearance.language}
              onChange={(e) =>
                setAppearance((p) => ({ ...p, language: e.target.value }))
              }
              className="w-full bg-transparent text-white text-[15px] outline-none"
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l} className="bg-[#1a1a1a]">
                  {l}
                </option>
              ))}
            </select>
          </div>
        </SectionCard>

        <Label text="Font size" />
        <SectionCard>
          <div className="p-4 flex gap-3">
            {fontSizes.map((f) => (
              <button
                key={f.id}
                onClick={() => setAppearance((p) => ({ ...p, fontSize: f.id }))}
                className={`flex-1 py-3 rounded-xl border text-[14px] font-medium transition-all ${
                  appearance.fontSize === f.id
                    ? "border-[#0095f6] bg-[#0095f6]/10 text-[#0095f6]"
                    : "border-[#2a2a2a] bg-[#131313] text-[#8e8e8e]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </SectionCard>

        <div className="px-4 mt-6">
          <button
            onClick={() => {
              setSaveMsg("success");
              setTimeout(() => setSaveMsg("idle"), 2000);
            }}
            className="w-full bg-[#0095f6] text-white text-[15px] font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2"
          >
            {saveMsg === "success" ? (
              <>
                <Check size={18} /> Saved
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </main>
    );
  }

  /*SECURITY*/
  if (section === "security") {
    return (
      <main className="max-w-md mx-auto bg-[#080808] min-h-screen text-white pb-24">
        <SubTopBar title="Security" onSave={savePassword} />

        <Label text="Change password" />
        <SectionCard>
          {/* Current */}
          <div className="px-4 py-3">
            <label className="block text-[11px] text-[#5e5e5e] uppercase tracking-widest mb-1.5">
              Current password
            </label>
            <div className="flex items-center gap-2">
              <input
                type={showPw ? "text" : "password"}
                value={passwords.current}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, current: e.target.value }))
                }
                placeholder="••••••••"
                className="flex-1 bg-transparent text-white text-[15px] outline-none placeholder:text-[#3e3e3e]"
              />
              <button onClick={() => setShowPw((s) => !s)} className="text-[#5e5e5e]">
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <Divider />
          {/* New */}
          <div className="px-4 py-3">
            <label className="block text-[11px] text-[#5e5e5e] uppercase tracking-widest mb-1.5">
              New password
            </label>
            <input
              type={showPw ? "text" : "password"}
              value={passwords.next}
              onChange={(e) =>
                setPasswords((p) => ({ ...p, next: e.target.value }))
              }
              placeholder="••••••••"
              className="w-full bg-transparent text-white text-[15px] outline-none placeholder:text-[#3e3e3e]"
            />
          </div>
          <Divider />
          {/* Confirm */}
          <div className="px-4 py-3">
            <label className="block text-[11px] text-[#5e5e5e] uppercase tracking-widest mb-1.5">
              Confirm new password
            </label>
            <input
              type={showPw ? "text" : "password"}
              value={passwords.confirm}
              onChange={(e) =>
                setPasswords((p) => ({ ...p, confirm: e.target.value }))
              }
              placeholder="••••••••"
              className="w-full bg-transparent text-white text-[15px] outline-none placeholder:text-[#3e3e3e]"
            />
          </div>
          {passwords.next &&
            passwords.confirm &&
            passwords.next !== passwords.confirm && (
              <p className="px-4 pb-3 text-[#ed4956] text-[12px]">
                Passwords do not match
              </p>
            )}
        </SectionCard>

        <Label text="Sessions" />
        <SectionCard>
          <div className="px-4 py-4">
            <p className="text-[15px] text-white">Active sessions</p>
            <p className="text-[12px] text-[#5e5e5e] mt-0.5">
              This device · Last active now
            </p>
          </div>
          <Divider />
          <button className="w-full px-4 py-4 text-left active:bg-[#151515]">
            <p className="text-[15px] text-[#ed4956]">Log out all other devices</p>
          </button>
        </SectionCard>

        {saveMsg === "error" && (
          <p className="text-[#ed4956] text-sm text-center mt-4">
            Passwords do not match or something went wrong.
          </p>
        )}

        <div className="px-4 mt-6">
          <button
            onClick={savePassword}
            disabled={saving || !passwords.current || !passwords.next}
            className="w-full bg-[#0095f6] text-white text-[15px] font-semibold py-3.5 rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : saveMsg === "success" ? (
              <>
                <Check size={18} /> Updated
              </>
            ) : (
              "Update password"
            )}
          </button>
        </div>
      </main>
    );
  }

  return null;
}