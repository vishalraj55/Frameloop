import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const auth = req.headers.get("Authorization");

  const res = await fetch(`${process.env.API_URL}/users/${username}`, {
    headers: {
      "Content-Type": "application/json",
      ...(auth && { Authorization: auth }),
    },
  });

  if (!res.ok) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const text = await res.text();
  if (!text) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const user = JSON.parse(text);
  return NextResponse.json(user);
}