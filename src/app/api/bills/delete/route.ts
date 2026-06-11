import { del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest) {
  try {
    const { pathname } = await request.json()

    if (!pathname || typeof pathname !== "string") {
      return NextResponse.json({ error: "No pathname provided" }, { status: 400 })
    }

    if (!pathname.startsWith("bills/")) {
      return NextResponse.json({ error: "Invalid pathname" }, { status: 400 })
    }

    await del(pathname)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Bill delete error:", error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
