import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL;

async function parseBody(req: NextRequest) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const body = await parseBody(req);
  const auth = req.headers.get("Authorization"); 
  const res = await fetch(`${API_URL}/users/${username}/follow`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(auth && { Authorization: auth }), 
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const body = await parseBody(req);
  const auth = req.headers.get("Authorization"); 

  const res = await fetch(`${API_URL}/users/${username}/follow`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(auth && { Authorization: auth }), 
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}