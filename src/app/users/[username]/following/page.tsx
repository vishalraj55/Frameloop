"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useTheme, THEME_COLORS } from "@/context/ThemeContext";
import { ArrowLeft, Search } from "lucide-react";

interface FollowUser {
  id: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  isFollowing?: boolean;
}

export default function FollowingPage() {
  const params = useParams();
  const router = useRouter();
  const username = params?.username as string;
  const { user: currentUser, loading: authLoading } = useAuth();
  const { resolvedTheme } = useTheme();
  const c = THEME_COLORS[resolvedTheme];

  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (authLoading || !currentUser) return;
    const fetch_ = async () => {
      try {
        const res = await fetch(`/api/users/${username}/following`, {
          headers: {
            Authorization: `Bearer ${await currentUser!.getIdToken()}`,
          },
        });
        if (res.ok) {
          const data = (await res.json()) as FollowUser[];
          setUsers(data.filter((u) => !!u.username));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (username) void fetch_();
  }, [username, currentUser, authLoading]);

  const handleFollow = async (targetUsername: string, isFollowing: boolean) => {
    const res = await fetch(`/api/users/${targetUsername}/follow`, {
      method: isFollowing ? "DELETE" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await currentUser!.getIdToken()}`,
      },
      body: JSON.stringify({ followerId: currentUser?.uid }),
    });
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) =>
          u.username === targetUsername
            ? { ...u, isFollowing: !isFollowing }
            : u,
        ),
      );
    }
  };

  const filtered = users.filter((u) =>
    u.username?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      className="max-w-200 mx-auto min-h-screen"
      style={{ background: c.bg, color: c.text }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 backdrop-blur-md border-b"
        style={{ background: c.bg, borderColor: c.border }}
      >
        <div className="flex items-center gap-4 px-4 pt-4 pb-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = c.cardMuted)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <ArrowLeft size={20} style={{ color: c.text }} />
          </button>
          <span className="text-[15px] font-semibold tracking-tight">
            {username}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex">
          <button
            onClick={() => router.push(`/users/${username}/followers`)}
            className="flex-1 py-3 text-[13px] transition-colors"
            style={{ color: c.textFaint }}
            onMouseEnter={(e) => (e.currentTarget.style.color = c.textMuted)}
            onMouseLeave={(e) => (e.currentTarget.style.color = c.textFaint)}
          >
            Followers
          </button>
          <button
            onClick={() => router.push(`/users/${username}/following`)}
            className="flex-1 py-3 text-[13px] font-semibold relative"
            style={{ color: c.text }}
          >
            Following
            <span
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full"
              style={{ background: c.text }}
            />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: c.textFaint }}
          />
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-[13px] rounded-xl pl-8 pr-4 py-2.5 outline-none border transition-colors placeholder:text-(--textFaint)"
            style={{
              background: c.cardMuted,
              borderColor: c.border,
              color: c.text,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = c.textMuted)}
            onBlur={(e) => (e.currentTarget.style.borderColor = c.border)}
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center mt-16">
          <div
            className="w-6 h-6 border-[1.5px] rounded-full animate-spin"
            style={{ borderColor: c.textFaint, borderTopColor: c.text }}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-20 gap-2">
          <p className="text-[14px] font-semibold" style={{ color: c.text }}>
            Not following anyone
          </p>
          <p className="text-[13px]" style={{ color: c.textFaint }}>
            Accounts followed will appear here
          </p>
        </div>
      ) : (
        <ul className="divide-y" style={{ borderColor: c.border }}>
          {filtered.map((user) => (
            <li
              key={user.id}
              className="flex items-center gap-3 px-4 py-3 transition-colors"
              style={{ borderColor: c.border }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = c.cardFaint)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <button
                onClick={() => router.push(`/profile/${user.username}`)}
                className="shrink-0"
              >
                <div
                  className="relative w-11 h-11 rounded-full overflow-hidden"
                  style={{
                    background: c.cardMuted,
                    boxShadow: `0 0 0 1px ${c.border}`,
                  }}
                >
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.username}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-[15px] font-semibold"
                      style={{ color: c.textMuted }}
                    >
                      {user.username[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
              </button>
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => router.push(`/profile/${user.username}`)}
                  className="text-left w-full"
                >
                  <p
                    className="text-[13px] font-semibold leading-tight"
                    style={{ color: c.text }}
                  >
                    {user.username}
                  </p>
                  {user.bio && (
                    <p
                      className="text-[12px] truncate mt-0.5 leading-tight"
                      style={{ color: c.textFaint }}
                    >
                      {user.bio}
                    </p>
                  )}
                </button>
              </div>
              {currentUser?.uid !== user.id && (
                <button
                  onClick={() =>
                    handleFollow(user.username, user.isFollowing ?? false)
                  }
                  className="px-5 py-2 min-w-26 rounded-md text-[13px] font-semibold shrink-0 transition-all active:scale-95 border"
                  style={
                    user.isFollowing
                      ? {
                          background: "transparent",
                          borderColor: c.border,
                          color: c.text,
                        }
                      : { background: c.text, borderColor: c.text, color: c.bg }
                  }
                  onMouseEnter={(e) => {
                    if (user.isFollowing)
                      e.currentTarget.style.borderColor = c.textMuted;
                    else e.currentTarget.style.opacity = "0.9";
                  }}
                  onMouseLeave={(e) => {
                    if (user.isFollowing)
                      e.currentTarget.style.borderColor = c.border;
                    else e.currentTarget.style.opacity = "1";
                  }}
                >
                  {user.isFollowing ? "Following" : "Follow"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}