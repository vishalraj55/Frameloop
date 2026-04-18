import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = req.headers.get("Authorization");
  const res = await fetch(`${process.env.API_URL}/posts/${id}`, {
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