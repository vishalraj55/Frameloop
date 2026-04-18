import { NextRequest, NextResponse } from "next/server";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    const { username } = await params;
    const auth = req.headers.get("Authorization");

    const res = await fetch(`${process.env.API_URL}/users/${username}/followers`, {
        headers: {
            "Content-Type": "application/json",
            ...(auth && { Authorization: auth }),
        },
    });

    if (!res.ok) {
        return NextResponse.json({ message: "Not found" }, { status: res.status });
    }

    const data = await res.json() as Record<string, unknown>[];
    const users = data
        .map((item) => Object.values(item).find((val) => val !== null && typeof val === "object"))
        .filter(Boolean);
    return NextResponse.json(users);
}