import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const auth = req.headers.get("Authorization");
    const res = await fetch(`${process.env.API_URL}/notifications`, {
        headers: {
            "Content-Type": "application/json",
            ...(auth && { Authorization: auth }),
        },
    });

    if (!res.ok) return NextResponse.json([], { status: 200 });
    const data = await res.json();
    return NextResponse.json(data);
}