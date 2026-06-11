import { list } from "@vercel/blob"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { blobs } = await list({ prefix: "bills/" })

    const files = blobs
      .map((blob) => ({
        pathname: blob.pathname,
        filename: blob.pathname.split("/").pop() || "bill",
        size: blob.size,
        uploadedAt: blob.uploadedAt,
      }))
      .sort(
        (a, b) =>
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
      )

    return NextResponse.json({ files })
  } catch (error) {
    console.error("[v0] Bill list error:", error)
    return NextResponse.json({ error: "Failed to list bills" }, { status: 500 })
  }
}
