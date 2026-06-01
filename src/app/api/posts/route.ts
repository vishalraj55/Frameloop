import { NextRequest, NextResponse } from "next/server";

const API = process.env.API_URL;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const auth = req.headers.get("Authorization");
  const params = new URLSearchParams();

  const limit = searchParams.get("limit") ?? "10";
  const cursor = searchParams.get("cursor");
  const userId = searchParams.get("userId");

  params.set("limit", limit);
  if (cursor) params.set("cursor", cursor);
  if (userId) params.set("userId", userId);

  const res = await fetch(`${API}/posts?${params.toString()}`, {
    headers: {
      "Content-Type": "application/json",
      ...(auth && { Authorization: auth }),
    },
    cache: "no-store",
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}