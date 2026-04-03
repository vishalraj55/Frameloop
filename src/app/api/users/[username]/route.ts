import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const res = await fetch(`${process.env.API_URL}/users/${username}`, {
    headers: {
      "Content-Type": "application/json",
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const formData = await req.formData();

  const res = await fetch(`${process.env.API_URL}/users/${username}`, {
    method: "PATCH",
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json() as { message?: string };
    return NextResponse.json(data, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}