"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Grid2x2, Bookmark, Plus } from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  hasActiveStory?: boolean;
  posts: PostType[];
  isFollowing?: boolean;
}

interface PostType {
  id: string;
  imageUrl: string;
  caption?: string;
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params?.username as string;

  const { data: session } = useSession();
  const currentUser = session?.user?.username;
  const token = session?.user?.token;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followHovered, setFollowHovered] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "saved">("posts");

  useEffect(() => {
    if (!username) return;

    const fetchProfile = async () => {
      try {
        const headers: HeadersInit = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`/api/users/${username}`, { headers });
        if (!res.ok) {
          setProfile(null);
          return;
        }
        const data = (await res.json()) as UserProfile;
        setProfile(data);
        setIsFollowing(data.isFollowing ?? false);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
  }, [username, token]);

  const handleFollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);

    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            followersCount: wasFollowing
              ? prev.followersCount - 1
              : prev.followersCount + 1,
          }
        : prev
    );

    try {
      const res = await fetch(`/api/users/${username}/follow`, {
        method: wasFollowing ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setIsFollowing(wasFollowing);
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                followersCount: wasFollowing
                  ? prev.followersCount + 1
                  : prev.followersCount - 1,
              }
            : prev
        );
      }
    } catch (err) {
      console.error(err);
      setIsFollowing(wasFollowing);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              followersCount: wasFollowing
                ? prev.followersCount + 1
                : prev.followersCount - 1,
            }
          : prev
      );
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="bg-black min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="bg-black min-h-screen flex items-center justify-center text-white text-sm">
        User not found.
      </main>
    );
  }

  const isOwnProfile = currentUser === profile.username;

  const followButtonLabel = () => {
    if (followLoading) return "...";
    if (isFollowing) return followHovered ? "Unfollow" : "Following";
    return "Follow";
  };

  const followButtonClass = () => {
    if (isFollowing) {
      return followHovered
        ? "bg-[#1c1c1c] border border-red-500 text-red-500"
        : "bg-[#1c1c1c] border border-[#363636] text-white";
    }
    return "bg-[#0095f6] text-white hover:bg-[#1aa3f5]";
  };

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="max-w-233.75 mx-auto">

        {/* Profile header */}
        <div className="flex items-center gap-5 px-4 pt-6 pb-4 md:gap-15 md:px-8 md:pt-10 md:pb-6">

          {/* Avatar */}
          <Link href={profile.hasActiveStory ? `/story/${profile.username}` : "#"} className="shrink-0">
            <div
              className={`p-0.5 rounded-full ${
                profile.hasActiveStory
                  ? "bg-linear-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]"
                  : "bg-[#262626]"
              }`}
            >
              <div className="p-0.75 rounded-full bg-black">
                <div className="relative w-19.25 h-19.25 md:w-37.5 md:h-37.5 rounded-full overflow-hidden bg-[#1c1c1c]">
                  {profile.avatarUrl ? (
                    <Image
                      src={profile.avatarUrl}
                      alt={profile.username}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl md:text-5xl font-medium">
                      {profile.username[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Link>

          {/* Stats */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:gap-5">
              <h2 className="text-xl md:text-[26px] font-light tracking-tight truncate">
                {profile.username}
              </h2>

              {isOwnProfile ? (
                <Link
                  href="/settings/profile"
                  className="inline-flex items-center justify-center bg-[#1c1c1c] border border-[#363636] rounded-lg py-1.75 px-4 text-[13px] md:text-sm font-semibold hover:bg-[#262626] transition-colors"
                >
                  Edit profile
                </Link>
              ) : (
                <button
                  onClick={() => void handleFollow()}
                  onMouseEnter={() => setFollowHovered(true)}
                  onMouseLeave={() => setFollowHovered(false)}
                  disabled={followLoading}
                  className={`inline-flex items-center justify-center rounded-lg py-1.75 px-4 text-[13px] md:text-sm font-semibold transition-colors duration-150 ${followButtonClass()}`}
                >
                  {followButtonLabel()}
                </button>
              )}
            </div>

            <div className="flex justify-around md:justify-start md:gap-10">
              <div className="text-center md:text-left">
                <span className="block md:inline text-[15px] font-semibold">
                  {profile.posts.length}
                </span>
                <span className="block md:inline text-[12px] md:text-[16px] text-[#8e8e8e] md:ml-1">
                  posts
                </span>
              </div>

              <button
                onClick={() => router.push(`/users/${username}/followers`)}
                className="text-center md:text-left"
              >
                <span className="block md:inline text-[15px] font-semibold">
                  {(profile.followersCount ?? 0).toLocaleString()}
                </span>
                <span className="block md:inline text-[12px] md:text-[16px] text-[#8e8e8e] md:ml-1">
                  followers
                </span>
              </button>

              <button
                onClick={() => router.push(`/users/${username}/following`)}
                className="text-center md:text-left"
              >
                <span className="block md:inline text-[15px] font-semibold">
                  {(profile.followingCount ?? 0).toLocaleString()}
                </span>
                <span className="block md:inline text-[12px] md:text-[16px] text-[#8e8e8e] md:ml-1">
                  following
                </span>
              </button>
            </div>

            {/* Bio visible on desktop  */}
            <div className="hidden md:block mt-4">
              <p className="text-[14px] font-semibold">{profile.username}</p>
              {profile.bio && (
                <p className="mt-1 text-[14px] text-[#f5f5f5] whitespace-pre-line leading-snug">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bio mobile only */}
        <div className="md:hidden px-4 pb-4">
          <p className="text-[13px] font-semibold">{profile.username}</p>
          {profile.bio && (
            <p className="mt-1 text-[13px] text-[#f5f5f5] whitespace-pre-line leading-snug">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Story highlights */}
        <div className="flex gap-4 md:gap-6 px-4 md:px-8 pb-4 md:pb-6 overflow-x-auto scrollbar-hide">
          {isOwnProfile && (
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="w-14 h-14 md:w-19.25 md:h-19.25 rounded-full border border-[#363636] bg-[#1c1c1c] flex items-center justify-center">
                <Plus size={20} className="text-white md:w-6 md:h-6" />
              </div>
              <span className="text-[11px] md:text-[12px] text-white">New</span>
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex border-t border-[#262626]">
          <button
            onClick={() => setActiveTab("posts")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 md:py-3.25 text-[12px] md:text-[13px] font-semibold tracking-widest uppercase transition-colors ${
              activeTab === "posts"
                ? "border-t border-white text-white"
                : "text-[#8e8e8e] hover:text-[#ccc]"
            }`}
          >
            <Grid2x2 size={15} />
            <span className="hidden sm:inline">Posts</span>
          </button>
          {isOwnProfile && (
            <button
              onClick={() => setActiveTab("saved")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 md:py-3.25 text-[12px] md:text-[13px] font-semibold tracking-widest uppercase transition-colors ${
                activeTab === "saved"
                  ? "border-t border-white text-white"
                  : "text-[#8e8e8e] hover:text-[#ccc]"
              }`}
            >
              <Bookmark size={13} />
              <span className="hidden sm:inline">Saved</span>
            </button>
          )}
        </div>

       {/* Posts grid */}
        {activeTab === "posts" && (
          <div className="grid grid-cols-3 gap-0.75">
            {profile.posts.length === 0 ? (
              <div className="col-span-3 flex flex-col items-center justify-center py-16 text-[#8e8e8e] gap-2">
                <Grid2x2 size={48} strokeWidth={1} />
                <p className="text-sm">No posts yet</p>
              </div>
            ) : (
              profile.posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="relative aspect-square group overflow-hidden"
                >
                  <Image
                    src={post.imageUrl}
                    alt={post.caption ?? ""}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:flex items-center justify-center">
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {activeTab === "saved" && (
          <div className="flex flex-col items-center justify-center py-16 text-[#8e8e8e] gap-2">
            <Bookmark size={48} strokeWidth={1} />
            <p className="text-sm">No saved posts</p>
          </div>
        )}

      </div>

    </div>
  );
}