import { NextRequest, NextResponse } from "next/server";

const API = process.env.API_URL;

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const res = await fetch(`${API}/posts/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    return NextResponse.json({ message: "Failed to delete post" }, { status: res.status });
  }

  return NextResponse.json({ success: true });
}