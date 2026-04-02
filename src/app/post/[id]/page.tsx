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
    <main className="min-h-screen bg-black flex justify-center py-8">
      <Post
        id={post.id}
        username={post.author.username}
        avatar={post.author.avatarUrl ?? null}
        imageUrl={post.imageUrl}
        caption={post.caption ?? ''}
        likes={post.likesCount ?? 0}
        createdAt={post.createdAt ?? ''}
      />
    </main>
  );
}