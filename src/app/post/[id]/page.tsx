import { notFound } from "next/navigation";
import Post from "@/components/Post";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const res = await fetch(`${process.env.API_URL}/posts/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) return notFound();

  const post = await res.json();

  return (
    <main className="min-h-screen bg-black">
      {/* top bar */}
      <div
        className="sticky top-0 z-10 flex items-center px-4 py-3 border-b"
        style={{ background: "rgba(0,0,0,0)", backdropFilter: "blur(12px)" }}
      >
        <p className="text-white font-semibold text-[15px] mx-auto">Post</p>
      </div>

      {/* post card */}
      <div className="flex justify-center py-6 px-0 sm:px-6">
        <div
          className="w-full sm:rounded-2xl overflow-hidden"
          style={{
            maxWidth: "480px",
            background: "#000",
            boxShadow: "0 24px 60px rgba(0,0,0,0)",
          }}
        >
          <Post
            id={post.id}
            authorId={post.author.id}
            username={post.author.username}
            avatar={post.author.avatarUrl ?? null}
            imageUrl={post.imageUrl}
            caption={post.caption ?? ""}
            likes={post.likes?.length ?? post.likesCount ?? 0}
            isLiked={false}
            createdAt={post.createdAt ?? ""}
            isFollowing={post.author.isFollowing ?? false}
          />
        </div>
      </div>
    </main>
  );
}