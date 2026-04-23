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

export async function PATCH(req: NextRequest) {
    const auth = req.headers.get("Authorization");
    const res = await fetch(`${process.env.API_URL}/notifications`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            ...(auth && { Authorization: auth }),
        },
    });

    if (!res.ok) return NextResponse.json({ success: false }, { status: res.status });
    return NextResponse.json({ success: true });
}