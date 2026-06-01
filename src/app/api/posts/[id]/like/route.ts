import { NextRequest, NextResponse } from "next/server";

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
  const auth = req.headers.get("Authorization");

  const res = await fetch(`${BACKEND_URL}/posts/${id}/like`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(auth && { Authorization: auth }),
    },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;

  const res = await fetch(`${BACKEND_URL}/posts/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const post: Post = await res.json();
  const count = post?.likes?.length ?? 0;

  return NextResponse.json({ liked: false, count });
}