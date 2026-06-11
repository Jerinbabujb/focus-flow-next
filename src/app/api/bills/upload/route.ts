import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const label = (formData.get("label") as string | null)?.trim() || ""
    const source = (formData.get("source") as string | null) || "desktop"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 })
    }

    const safeLabel = label.replace(/[^a-z0-9-_ ]/gi, "").slice(0, 60) || "bill"
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const pathname = `bills/${Date.now()}-${safeLabel.replace(/\s+/g, "-")}.${ext}`

    const blob = await put(pathname, file, {
      access: "private",
      addRandomSuffix: true,
      contentType: file.type,
    })

    return NextResponse.json({
      pathname: blob.pathname,
      label: safeLabel,
      source,
      uploadedAt: Date.now(),
    })
  } catch (error) {
    console.error("[v0] Bill upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
