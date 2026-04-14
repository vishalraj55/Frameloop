import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type Params = { params: Promise<{ id: string }> };

interface Like {
  id: string;
  userId: string;
  postId: string;
}

interface Post {
  likes: Like[];
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const res = await fetch(`${BACKEND_URL}/posts/${id}/like`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: session.user.id }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const res = await fetch(`${BACKEND_URL}/posts/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const post: Post = await res.json();
  const count = post?.likes?.length ?? 0;
  const liked = session?.user?.id
    ? post?.likes?.some((l: Like) => l.userId === session.user.id)
    : false;

  return NextResponse.json({ liked, count });
}