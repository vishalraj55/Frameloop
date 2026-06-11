"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Grid2x2, Bookmark, Plus } from "lucide-react";

interface UserProfile {
  id: string;
  fullName: string;
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

  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showUnfollowMenu, setShowUnfollowMenu] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "saved">("posts");
  const isOwnProfile = useMemo(
    () => !!user && user.uid === profile?.id,
    [user, profile?.id],
  );

  useEffect(() => {
    if (!username) return;
    if (authLoading) return;

    const timeout = setTimeout(() => setLoading(false), 10_000);

    const fetchProfile = async () => {
      try {
        const headers: HeadersInit = {};
        if (user) {
          const token = await user.getIdToken();
          headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch(`/api/users/${username}`, { headers });
        if (!res.ok) {
          setProfile(null);
          return;
        }
        const data = (await res.json()) as UserProfile;
        setProfile(data);
        setIsFollowing(data.isFollowing ?? false);
        if (data.avatarUrl) {
          localStorage.setItem("avatarUrl", data.avatarUrl);
        }
      } catch (err) {
        console.error(err);
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    };

    void fetchProfile();
    return () => clearTimeout(timeout);
  }, [username, user, authLoading]);

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
        : prev,
    );

    try {
      const res = await fetch(`/api/users/${username}/follow`, {
        method: wasFollowing ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${await user!.getIdToken()}` },
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
            : prev,
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
          : prev,
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

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="max-w-233.75 mx-auto">
        {/* Profile header */}
        <div className="flex items-center gap-5 px-4 pt-6 pb-4 md:gap-15 md:px-8 md:pt-10 md:pb-6">
          {/* Avatar */}
          <Link
            href={profile.hasActiveStory ? `/story/${profile.username}` : "#"}
            className="shrink-0"
          >
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
            <div className="mb-4">
              <h2 className="text-xl md:text-[26px] font-light tracking-tight truncate">
                {profile.fullName}
              </h2>
            </div>

            {/* Bio visible on desktop  */}
            <div className="hidden md:block mt-4 mb-4">
              {/* <p className="text-[14px] font-semibold">{profile.fullName}</p> */}
              {profile.bio && (
                <p className="mt-1 text-[14px] text-[#f5f5f5] whitespace-pre-line leading-snug">
                  {profile.bio}
                </p>
              )}
            </div>

            <div className="flex justify-around md:justify-start md:gap-10 mb-4">
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

            {/* Edit / follow button */}
            <div className="flex items-center gap-2 mt-2 w-full">
              {isOwnProfile ? (
                <>
                  <Link
                    href="/settings/profile"
                    className="flex-1 inline-flex items-center justify-center bg-[#363636] rounded-lg py-2 px-4 text-[13px] md:text-[14px] font-semibold text-white transition-colors"
                  >
                    Edit profile
                  </Link>
                  <Link
                    href="/archive"
                    className="flex-1 inline-flex items-center justify-center bg-[#363636] rounded-lg py-2 px-4 text-[13px] md:text-[14px] font-semibold text-white transition-colors"
                  >
                    View archive
                  </Link>
                </>
              ) : (
                <>
                  <div className="relative flex-1 inline-flex items-center justify-center bg-[#363636] rounded-lg py-2 px-4 text-[13px] md:text-[14px] font-semibold text-white transition-colors">
                    <button
                      onClick={() => {
                        if (isFollowing) {
                          setShowUnfollowMenu(!showUnfollowMenu);
                        } else {
                          void handleFollow();
                        }
                      }}
                      disabled={followLoading}
                      className="w-full inline-flex items-center justify-center gap-1.5 bg-[#363636] rounded-lg py-2 px-4 text-[13px] md:text-[14px] font-semibold text-white disabled:opacity-70 transition-colors"
                    >
                      {followLoading ? (
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          {isFollowing ? "Following" : "Follow"}
                          {isFollowing && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={`transition-transform duration-200 ${showUnfollowMenu ? "rotate-180" : ""}`}
                            >
                              <path d="M6 9l6 6 6-6" />
                            </svg>
                          )}
                        </>
                      )}
                    </button>

                    {/* Dropdown */}
                    {showUnfollowMenu && isFollowing && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowUnfollowMenu(false)}
                        />
                        <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-[#262626] rounded-xl overflow-hidden shadow-xl border border-[#3f3f3f]">
                          <button
                            onClick={() => {
                              setShowUnfollowMenu(false);
                              void handleFollow();
                            }}
                            className="w-full px-4 py-3 text-left text-[14px] font-semibold text-red-400"
                          >
                            {" "}
                            Unfollow{" "}
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* <button
                    className="flex-1 inline-flex items-center justify-center bg-[#363636] rounded-lg py-2 px-4 text-[13px] md:text-[14px] font-semibold text-white transition-colors"
                    onClick={() => router.push(`/messages/${username}`)}
                  >
                    Message
                  </button> */}
                </> // For future implementation of messaging feature
              )}
            </div>
          </div>
        </div>

        {/* Bio mobile only */}
        <div className="md:hidden px-4 pb-4">
          {/* <p className="text-[13px] font-semibold">{profile.fullName}</p> */}
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
        <div className="flex border-t border-[#262626] py-2 ">
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
              profile.posts.map((post, index) => (
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
                    priority={index === 0}
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:flex items-center justify-center"></div>
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