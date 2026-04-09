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

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "saved">("posts");

  useEffect(() => {
    if (!username) return;
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/users/${username}`);
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
  }, [username]);

  const handleFollow = async () => {
    const token = session?.user?.token;
    const wasFollowing = isFollowing;

    try {
      const res = await fetch(`/api/users/${username}/follow`, {
        method: wasFollowing ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ followerId: session?.user?.id }),
      });
      if (res.ok) setIsFollowing((prev) => !prev);
    } catch (err) {
      console.error(err);
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

  return (
    <div className="max-w-117.5 mx-auto bg-black text-white min-h-screen">

      <div className="flex items-center gap-6 px-4 pt-5 pb-4">

        <Link href={profile.hasActiveStory ? `/story/${profile.username}` : "#"}>
          <div
            className={`p-0.5 rounded-full ${
              profile.hasActiveStory
                ? "bg-linear-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]"
                : "bg-[#262626]"
            }`}
          >
            <div className="p-0.5 rounded-full bg-black">
              <div className="relative w-18.5 h-18.5 rounded-full overflow-hidden bg-[#1c1c1c]">
                {profile.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt={profile.username}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-medium">
                    {profile.username[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Link>

        {/* Stats */}
        <div className="flex-1">
          <div className="flex justify-around mb-3">
            <div className="text-center">
              <div className="text-[15px] font-semibold">{profile.posts.length}</div>
              <div className="text-[12px] text-[#8e8e8e]">posts</div>
            </div>

            {/* Followers */}
            <button
              onClick={() => router.push(`/users/${username}/followers`)}
              className="text-center"
            >
              <div className="text-[15px] font-semibold">
                {(profile.followersCount ?? 0).toLocaleString()}
              </div>
              <div className="text-[12px] text-[#8e8e8e]">followers</div>
            </button>

            {/* Following */}
            <button
              onClick={() => router.push(`/users/${username}/following`)}
              className="text-center"
            >
              <div className="text-[15px] font-semibold">
                {(profile.followingCount ?? 0).toLocaleString()}
              </div>
              <div className="text-[12px] text-[#8e8e8e]">following</div>
            </button>
          </div>

          {/* Action button */}
          {isOwnProfile ? (
            <Link
              href="/settings/profile"
              className="block w-full text-center bg-[#1c1c1c] border border-[#363636] rounded-lg py-1.5 text-[13px] font-medium"
            >
              Edit profile
            </Link>
          ) : (
            <button
              onClick={handleFollow}
              className={`w-full rounded-lg py-1.5 text-[13px] font-semibold ${
                isFollowing
                  ? "bg-[#1c1c1c] border border-[#363636] text-white"
                  : "bg-[#0095f6] text-white"
              }`}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>
      </div>

      {/* Username & bio */}
      <div className="px-4 pb-4">
        <div className="text-[13px] font-semibold mb-1">{profile.username}</div>
        {profile.bio && (
          <div className="text-[13px] text-[#f5f5f5] whitespace-pre-line">{profile.bio}</div>
        )}
      </div>

      {/* Story highlights */}
      <div className="flex gap-4 px-4 pb-4 overflow-x-auto scrollbar-hide">
        {isOwnProfile && (
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="w-14 h-14 rounded-full border border-[#363636] bg-[#1c1c1c] flex items-center justify-center">
              <Plus size={20} className="text-white" />
            </div>
            <span className="text-[11px] text-white">New</span>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex border-t border-[#262626]">
        <button
          onClick={() => setActiveTab("posts")}
          className={`flex-1 flex justify-center py-3 ${
            activeTab === "posts" ? "border-t border-white" : ""
          }`}
        >
          <Grid2x2
            size={22}
            className={activeTab === "posts" ? "text-white" : "text-[#8e8e8e]"}
          />
        </button>
        {isOwnProfile && (
          <button
            onClick={() => setActiveTab("saved")}
            className={`flex-1 flex justify-center py-3 ${
              activeTab === "saved" ? "border-t border-white" : ""
            }`}
          >
            <Bookmark
              size={22}
              className={activeTab === "saved" ? "text-white" : "text-[#8e8e8e]"}
            />
          </button>
        )}
      </div>

      {/* Posts grid */}
      <div className="grid grid-cols-3 gap-0.5">
        {profile.posts.map((post) => (
          <Link
            key={post.id}
            href={`/post/${post.id}`}
            className="relative aspect-square"
          >
            <Image
              src={post.imageUrl}
              alt={post.caption ?? ""}
              fill
              className="object-cover"
            />
          </Link>
        ))}
      </div>

    </div>
  );
}