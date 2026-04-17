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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const formData = await req.formData();
  const token = formData.get("token") as string;
  formData.delete("token");

  const res = await fetch(`${process.env.API_URL}/users/${username}`, {
    method: "PATCH",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    const message = text
      ? (JSON.parse(text) as { message?: string }).message
      : "Something went wrong";
    return NextResponse.json({ message }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}