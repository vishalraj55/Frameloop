"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { ArrowLeft } from "lucide-react";

interface FollowUser {
  id: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  isFollowing?: boolean;
}

export default function FollowersPage() {
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
        const res = await fetch(`/api/users/${username}/followers`, {
          headers: { Authorization: `Bearer ${session?.user?.token}` },
        });
        if (res.ok) {
          const data = (await res.json()) as FollowUser[];
          setUsers(data);
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
    const token = session?.user?.token;
    const res = await fetch(`/api/users/${targetUsername}/follow`, {
      method: isFollowing ? "DELETE" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ followerId: session?.user?.id }),
    });
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) =>
          u.username === targetUsername ? { ...u, isFollowing: !isFollowing } : u
        )
      );
    }
  };

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-117.5 mx-auto bg-black text-white min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#262626]">
        <button onClick={() => router.back()}>
          <ArrowLeft size={22} className="text-white" />
        </button>
        <span className="text-[15px] font-semibold">{username}</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#262626]">
        <button
          onClick={() => router.push(`/users/${username}/followers`)}
          className="flex-1 py-3 text-[13px] font-semibold border-b border-white"
        >
          Followers
        </button>
        <button
          onClick={() => router.push(`/users/${username}/following`)}
          className="flex-1 py-3 text-[13px] text-[#8e8e8e]"
        >
          Following
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-2">
        <input
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#1c1c1c] text-white text-[13px] rounded-lg px-4 py-2 outline-none placeholder:text-[#8e8e8e]"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center mt-10">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <ul>
          {filtered.map((user) => (
            <li key={user.id} className="flex items-center gap-3 px-4 py-2">
              <button onClick={() => router.push(`/users/${user.username}`)}>
                <div className="relative w-11 h-11 rounded-full overflow-hidden bg-[#1c1c1c] shrink-0">
                  {user.avatarUrl ? (
                    <Image src={user.avatarUrl} alt={user.username} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-base font-medium">
                      {user.username[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
              </button>
              <div className="flex-1 min-w-0">
                <button onClick={() => router.push(`/users/${user.username}`)}>
                  <div className="text-[13px] font-semibold">{user.username}</div>
                  {user.bio && (
                    <div className="text-[12px] text-[#8e8e8e] truncate">{user.bio}</div>
                  )}
                </button>
              </div>
              {session?.user?.username !== user.username && (
                <button
                  onClick={() => handleFollow(user.username, user.isFollowing ?? false)}
                  className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold shrink-0 ${
                    user.isFollowing
                      ? "bg-[#1c1c1c] border border-[#363636] text-white"
                      : "bg-[#0095f6] text-white"
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