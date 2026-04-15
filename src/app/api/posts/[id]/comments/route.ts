import { NextRequest, NextResponse } from 'next/server';
const API = process.env.API_URL;
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = req.nextUrl;

  const page    = searchParams.get('page')    ?? '1';
  const limit   = searchParams.get('limit')   ?? '10';
  const sort    = searchParams.get('sort')    ?? 'newest';
  const parentId = searchParams.get('parentId') ?? ''; 

  const query = new URLSearchParams({ page, limit, sort, ...(parentId && { parentId }) });

  const res  = await fetch(`${API}/posts/${id}/comments?${query}`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json() as {
    authorId : string;
    text     : string;
    parentId?: string;
  };

  const res  = await fetch(`${API}/posts/${id}/comments`, {
    method  : 'POST',
    headers : { 'Content-Type': 'application/json' },
    body    : JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json() as {
    commentId : string;
    action    : 'edit' | 'like' | 'dislike' | 'pin' | 'report';
    text?     : string;
    userId?   : string; 
    reason?   : string; 
  };

  const { commentId, action, ...payload } = body;

  const res  = await fetch(`${API}/posts/${id}/comments/${commentId}/${action}`, {
    method  : 'PATCH',
    headers : { 'Content-Type': 'application/json' },
    body    : JSON.stringify(payload),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json() as {
    commentId : string;
    userId    : string;
    hard?     : boolean;  
  };

  const { commentId, ...payload } = body;

  const res  = await fetch(`${API}/posts/${id}/comments/${commentId}`, {
    method  : 'DELETE',
    headers : { 'Content-Type': 'application/json' },
    body    : JSON.stringify(payload),
  });
  if (res.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}