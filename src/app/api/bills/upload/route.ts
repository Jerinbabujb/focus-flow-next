import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/src/lib/prisma"
import { cookies } from "next/headers"
import { decrypt } from "@/src/lib/session"
import { TextractClient, AnalyzeExpenseCommand } from "@aws-sdk/client-textract"

const textractClient = new TextractClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
})

function autoCategorize(itemName: string): string {
  const name = itemName.toLowerCase();
  if (name.match(/milk|cheese|butter|yogurt|cream/)) return "DAIRY";
  if (name.match(/apple|banana|lettuce|tomato|onion|berry|garlic|potato/)) return "PRODUCE";
  if (name.match(/chicken|beef|pork|steak|salmon|fish|turkey/)) return "MEAT";
  if (name.match(/bread|bun|bagel|croissant|muffin/)) return "BAKERY";
  if (name.match(/pizza|ice cream|frozen/)) return "FROZEN";
  if (name.match(/soap|paper|towel|cleaner|detergent|trash/)) return "HOUSEHOLD";
  if (name.match(/pasta|rice|cereal|soup|sauce|snack|chip/)) return "PANTRY";
  return "OTHER";
}

// Helper to safely parse dates from Textract
function parseTextractDate(dateString: string | null): Date | null {
  if (!dateString) return null;
  const parsed = new Date(dateString);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    const parsed = await decrypt(session);
    
    if (!parsed?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = parsed.userId as string;

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const source = (formData.get("source") as string | null) || "desktop"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only images and PDFs are allowed" }, { status: 400 })
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // --- AWS TEXTRACT AI PROCESSING ---
    let extractedVendor = null;
    let extractedTotal = 0;
    let extractedDate = null;
    const lineItems: any[] = []; 

    try {
      const command = new AnalyzeExpenseCommand({
        Document: { Bytes: fileBuffer }
      });
      const textractResponse = await textractClient.send(command);
      
      const expenseDocs = textractResponse.ExpenseDocuments || [];
      for (const doc of expenseDocs) {
        
        // A. Summary Fields (Vendor, Total, Date)
        for (const field of doc.SummaryFields || []) {
          if (field.Type?.Text === "VENDOR_NAME") {
            extractedVendor = field.ValueDetection?.Text;
          }
          if (field.Type?.Text === "INVOICE_RECEIPT_DATE") {
            extractedDate = field.ValueDetection?.Text;
          }
          if (field.Type?.Text === "TOTAL") {
            const cleanNumber = field.ValueDetection?.Text?.replace(/[^0-9.-]+/g, "");
            extractedTotal = parseFloat(cleanNumber || "0");
          }
        }

        // B. Line Items
        for (const group of doc.LineItemGroups || []) {
          for (const item of group.LineItems || []) {
            let itemName = "";
            let itemPrice = 0;

            for (const field of item.LineItemExpenseFields || []) {
              if (field.Type?.Text === "ITEM") {
                itemName = field.ValueDetection?.Text || "";
              }
              if (field.Type?.Text === "PRICE") {
                const cleanPrice = field.ValueDetection?.Text?.replace(/[^0-9.-]+/g, "");
                itemPrice = parseFloat(cleanPrice || "0");
              }
            }

            if (itemName && itemPrice > 0) {
              // Standardize to match Prisma Enum
              let categoryEnum = autoCategorize(itemName) as any;
              
              lineItems.push({
                name: itemName.slice(0, 255), // Prisma safety limit
                amount: itemPrice,
                category: categoryEnum, 
                quantity: 1 
              });
            }
          }
        }
      }
    } catch (aiError) {
      console.error("[v0] Textract processing failed:", aiError);
    }

    // --- VERCEL BLOB UPLOAD ---
    const ext = file.name.split(".").pop()?.toLowerCase() || (file.type === "application/pdf" ? "pdf" : "jpg")
    const safeVendorName = extractedVendor 
      ? extractedVendor.replace(/[^a-z0-9-_ ]/gi, "").slice(0, 40).replace(/\s+/g, "-") 
      : "receipt"
    
    const pathname = `bills/${userId}/${Date.now()}-${safeVendorName}.${ext}`

    const blob = await put(pathname, file, {
      access: "public", 
      addRandomSuffix: true,
      contentType: file.type,
    })

    // --- PRISMA DATABASE SAVE ---
    // Make sure your schema has `items BillItem[]` inside BillArchive!
    await prisma.billArchive.create({
      data: {
        userId: userId,
        s3Url: blob.url, 
        vendorName: extractedVendor || "Unknown Vendor",
        amount: extractedTotal,
        receiptDate: parseTextractDate(extractedDate || null),
        items: {
          create: lineItems
        }
      }
    })

    return NextResponse.json({
      pathname: blob.url, // Send back the public URL
      label: extractedVendor,
      amount: extractedTotal,
      date: extractedDate,
      items: lineItems,
      source,
      uploadedAt: Date.now(),
    })
  } catch (error) {
    console.error("[v0] Bill upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}