import { NextResponse } from "next/server"
import prisma from "@/src/lib/prisma"
import { cookies } from "next/headers"
import { decrypt } from "@/src/lib/session"

export async function GET() {
  try {
    // 1. Authenticate User
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    const parsed = await decrypt(session);
    if (!parsed?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = parsed.userId as string;

    // 2. Fetch User's Bills from Database
    const dbBills = await prisma.billArchive.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    })

    // 3. Format to match your existing frontend UI interface
    const files = dbBills.map((bill) => ({
      id: bill.id,
      pathname: bill.s3Url, // Passing the full URL back
      filename: bill.vendorName || "Untitled Bill",
      size: 0, // No longer tracked in DB, UI will ignore
      uploadedAt: bill.createdAt.toISOString(),
      amount: bill.amount
    }))

    return NextResponse.json({ files })
  } catch (error) {
    console.error("[v0] Bill list error:", error)
    return NextResponse.json({ error: "Failed to list bills" }, { status: 500 })
  }
}