import { NextRequest, NextResponse } from "next/server";

const API = process.env.API_URL;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const params = new URLSearchParams();

  const limit = searchParams.get("limit") ?? "10";
  const cursor = searchParams.get("cursor");

  params.set("limit", limit);
  if (cursor) params.set("cursor", cursor);

  const res = await fetch(`${API}/posts?${params.toString()}`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}