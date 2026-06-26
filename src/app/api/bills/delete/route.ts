import { del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/src/lib/prisma"
import { cookies } from "next/headers"
import { decrypt } from "@/src/lib/session"

export async function DELETE(request: NextRequest) {
  try {
    // 1. Authenticate User
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    const parsed = await decrypt(session);
    if (!parsed?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { pathname } = await request.json()

    if (!pathname || typeof pathname !== "string") {
      return NextResponse.json({ error: "No pathname provided" }, { status: 400 })
    }

    // 2. Delete from Vercel Blob
    await del(pathname)

    // 3. Delete from AWS Aurora Database
    await prisma.billArchive.deleteMany({
      where: {
        s3Url: pathname,
        userId: parsed.userId as string // Extra security check
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Bill delete error:", error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}