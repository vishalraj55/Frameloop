"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useSession } from "next-auth/react";
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
  const { data: session } = useSession();

  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(`/api/users/${username}/following`, {
          headers: { Authorization: `Bearer ${session?.user?.token}` },
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
  }, [username, session]);

  const handleFollow = async (targetUsername: string, isFollowing: boolean) => {
    const res = await fetch(`/api/users/${targetUsername}/follow`, {
      method: isFollowing ? "DELETE" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user?.token}`,
      },
      body: JSON.stringify({ followerId: session?.user?.id }),
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
    <div className="max-w-117.5 mx-auto bg-black text-white min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-md border-b border-[#1f1f1f]">
        <div className="flex items-center gap-4 px-4 pt-4 pb-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <span className="text-[15px] font-semibold tracking-tight">
            {username}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex">
          <button
            onClick={() => router.push(`/users/${username}/followers`)}
            className="flex-1 py-3 text-[13px] text-[#666] hover:text-[#999] transition-colors"
          >
            Followers
          </button>
          <button
            onClick={() => router.push(`/users/${username}/following`)}
            className="flex-1 py-3 text-[13px] font-semibold text-white relative"
          >
            Following
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-white rounded-full" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]"
          />
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#161616] border border-[#2a2a2a] text-white text-[13px] rounded-xl pl-8 pr-4 py-2.5 outline-none placeholder:text-[#555] focus:border-[#444] transition-colors"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center mt-16">
          <div className="w-6 h-6 border-[1.5px] border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-20 gap-2">
          <p className="text-[14px] font-semibold text-white">
            Not following anyone
          </p>
          <p className="text-[13px] text-[#555]">
            Accounts followed will appear here
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[#1a1a1a]">
          {filtered.map((user) => (
            <li
              key={user.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/2 transition-colors"
            >
              <button
                onClick={() => router.push(`/profile/${user.username}`)}
                className="shrink-0"
              >
                <div className="relative w-11 h-11 rounded-full overflow-hidden bg-[#1c1c1c] ring-1 ring-white/10">
                  {user.avatarUrl ? (
                    <Image src={user.avatarUrl} alt={user.username} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[15px] font-semibold text-white/80">
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
                  <p className="text-[13px] font-semibold leading-tight">
                    {user.username}
                  </p>
                  {user.bio && (
                    <p className="text-[12px] text-[#666] truncate mt-0.5 leading-tight">
                      {user.bio}
                    </p>
                  )}
                </button>
              </div>
              {session?.user?.username !== user.username && (
                <button
                  onClick={() =>
                    handleFollow(user.username, user.isFollowing ?? false)
                  }
                  className={`px-4 py-1.5 rounded-lg text-[12px] font-semibold shrink-0 transition-all active:scale-95 ${
                    user.isFollowing
                      ? "bg-transparent border border-[#333] text-white hover:border-[#555]"
                      : "bg-white text-black hover:bg-white/90"
                  }`}
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