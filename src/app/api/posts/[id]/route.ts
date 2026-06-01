import { NextRequest, NextResponse } from "next/server";

const API = process.env.API_URL;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = req.headers.get("Authorization");

  const res = await fetch(`${API}/posts/${id}`, {
    headers: {
      "Content-Type": "application/json",
      ...(auth && { Authorization: auth }),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ message: "Post not found" }, { status: res.status });
  }

  return NextResponse.json(await res.json());
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = req.headers.get("Authorization");

  const res = await fetch(`${API}/posts/${id}`, {
    method: "DELETE",
    headers: {
      ...(auth && { Authorization: auth }),
    },
  });

  if (!res.ok) {
    return NextResponse.json({ message: "Failed to delete post" }, { status: res.status });
  }

  return NextResponse.json({ success: true });
}