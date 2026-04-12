import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

/* -- toggle like -- */
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const postId = params.id;
  const userId = session.user.id;

  // Check if post exists
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    return NextResponse.json({ message: "Post not found" }, { status: 404 });
  }

  // Check if already liked
  const existing = await prisma.like.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  if (existing) {
    // Unlike
    await prisma.like.delete({
      where: { userId_postId: { userId, postId } },
    });
    const count = await prisma.like.count({ where: { postId } });
    return NextResponse.json({ liked: false, count });
  } else {
    // Like
    await prisma.like.create({ data: { userId, postId } });
    const count = await prisma.like.count({ where: { postId } });
    return NextResponse.json({ liked: true, count });
  }
}

/* ── GET /api/posts/[id]/like — get like status + count ── */
export async function GET(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  const postId = params.id;
  const userId = session?.user?.id;

  const count = await prisma.like.count({ where: { postId } });

  if (!userId) {
    return NextResponse.json({ liked: false, count });
  }

  const existing = await prisma.like.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  return NextResponse.json({ liked: !!existing, count });
}