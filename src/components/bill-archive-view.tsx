"use client"

import { useState, useRef, useEffect } from "react"
import useSWR from "swr"
import QRCode from "qrcode"
import { PDFDocument } from "pdf-lib"
import {
  Archive, ImagePlus, Camera, QrCode, Loader2, Trash2, X, RefreshCw, Smartphone, Receipt, Lock
} from "lucide-react"

interface BillFile {
  id: string
  pathname: string
  filename: string
  amount: number
  uploadedAt: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

const formatMoney = (n: number) => 
  n.toLocaleString(undefined, { style: "currency", currency: "USD" })

export function BillArchiveView() {
  const { data, isLoading, mutate } = useSWR<{ files: BillFile[] }>(
    "/api/bills/list",
    fetcher,
    { refreshInterval: 5000 },
  )
  const bills = data?.files ?? []

  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [qrDataUrl, setQrDataUrl] = useState("")
  const [showQr, setShowQr] = useState(false)
  const [uploadUrl, setUploadUrl] = useState("")
  const [preview, setPreview] = useState<string | null>(null)
  
  // PDF Password State
  const [lockedPdf, setLockedPdf] = useState<File | null>(null)
  const [pdfPassword, setPdfPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")

  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const url = `${window.location.origin}/upload-bill`
    setUploadUrl(url)
    QRCode.toDataURL(url, { width: 240, margin: 1 })
      .then(setQrDataUrl)
      .catch((err) => console.error("[v0] QR generation error:", err))
  }, [])

  const uploadToServer = async (fileToUpload: File) => {
    setUploading(true)
    setUploadError("")
    try {
      const formData = new FormData()
      formData.append("file", fileToUpload)
      formData.append("source", "desktop")
      const res = await fetch("/api/bills/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")
      await mutate()
    } catch (err) {
      console.error("[v0] desktop upload error:", err)
      setUploadError("Could not upload the file. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = "" 

    if (file.type === "application/pdf") {
      try {
        const arrayBuffer = await file.arrayBuffer()
        await PDFDocument.load(arrayBuffer)
        // If it succeeds, it's NOT locked.
        await uploadToServer(file)
      } catch (err: any) {
        if (err.message.includes("encrypted") || err.message.includes("password")) {
          setLockedPdf(file)
          setPasswordError("")
          setPdfPassword("")
        } else {
          setUploadError("Failed to read PDF file.")
        }
      }
    } else {
      await uploadToServer(file)
    }
  }

  const handleUnlockPdf = async () => {
    if (!lockedPdf) return
    try {
      const arrayBuffer = await lockedPdf.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer, { password: pdfPassword.trim() })
      const unlockedBytes = await pdfDoc.save()
      const unlockedFile = new File([unlockedBytes], lockedPdf.name, { type: "application/pdf" })
      
      setLockedPdf(null)
      await uploadToServer(unlockedFile)
    } catch (err: any) {
      setPasswordError("Incorrect password. Please try again.")
    }
  }

  const handleDelete = async (pathname: string) => {
    try {
      await fetch("/api/bills/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathname }),
      })
      await mutate()
    } catch (err) {
      console.error("[v0] delete error:", err)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="glass flex flex-col gap-1 rounded-3xl p-5 md:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Archive className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-balance text-xl font-semibold text-foreground">Bill Archive</h1>
            <p className="text-sm text-muted-foreground">
              Upload statements or scan the code to add receipts from your phone
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Direct upload */}
        <div className="glass flex flex-col gap-4 rounded-3xl p-5 md:p-6">
          <div className="flex items-center gap-2">
            <ImagePlus className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Add from this device</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              disabled={uploading}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card/50 py-6 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
            >
              <Camera className="h-6 w-6 text-primary" />
              Take photo
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              disabled={uploading}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card/50 py-6 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
            >
              <ImagePlus className="h-6 w-6 text-primary" />
              Choose file
            </button>
          </div>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleSelect} className="hidden" />
          <input ref={galleryRef} type="file" accept="image/*,application/pdf" onChange={handleSelect} className="hidden" />
          
          {uploading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Uploading & Processing AI...
            </p>
          )}
          {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
        </div>

        {/* QR - desktop only */}
        <div className="glass hidden flex-col gap-4 rounded-3xl p-5 md:p-6 lg:flex">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Add from your phone</h2>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowQr(true)}
              className="flex h-28 w-28 shrink-0 items-center justify-center rounded-xl border border-border bg-card p-2 transition-transform hover:scale-105"
            >
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="QR code" className="h-full w-full" />
              ) : (
                <QrCode className="h-8 w-8 text-muted-foreground" />
              )}
            </button>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <p className="text-pretty">
                Scan this code with your phone camera to open the uploader. Snap a receipt and it will appear here.
              </p>
              <button type="button" onClick={() => setShowQr(true)} className="self-start text-sm font-medium text-primary hover:underline">
                Enlarge code
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Saved bills */}
      <div className="glass flex flex-col gap-4 rounded-3xl p-5 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              Saved bills{bills.length > 0 ? ` (${bills.length})` : ""}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => mutate()}
            className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading archive...
          </div>
        ) : bills.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Archive className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">No bills yet</p>
            <p className="text-sm text-muted-foreground">Upload an image or PDF to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {bills.map((bill) => (
              <div key={bill.id} className="group relative overflow-hidden rounded-xl border border-border bg-card/50">
                <button
                  type="button"
                  onClick={() => setPreview(bill.pathname)}
                  className="block aspect-[3/4] w-full overflow-hidden bg-secondary/30"
                >
                  {bill.pathname.endsWith('.pdf') ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground group-hover:bg-secondary/50 transition-colors">
                       <Receipt className="h-8 w-8" />
                       <span className="text-xs font-medium">PDF Document</span>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={bill.pathname} alt={bill.filename} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(bill.pathname)}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-background/80 text-destructive opacity-0 backdrop-blur transition-opacity hover:bg-background group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <div className="flex flex-col gap-0.5 p-3 bg-card border-t border-border">
                  <p className="truncate text-xs font-semibold text-foreground">{bill.filename}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-muted-foreground">{formatDate(bill.uploadedAt)}</p>
                    {bill.amount > 0 && (
                      <p className="text-[11px] font-bold text-primary">{formatMoney(bill.amount)}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PDF Password Modal */}
      {lockedPdf && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="glass relative flex w-full max-w-sm flex-col gap-4 rounded-3xl p-6 shadow-xl">
            <button onClick={() => setLockedPdf(null)} className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
            <div className="flex flex-col items-center gap-2 text-center mt-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-chart-4/15 text-chart-4">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Encrypted PDF</h3>
              <p className="text-sm text-muted-foreground">
                "{lockedPdf.name}" is password protected. Enter the password to securely unlock and scan it.
              </p>
            </div>
            <div className="flex flex-col gap-2 mt-4">
              <input
                type="password"
                placeholder="Document Password"
                value={pdfPassword}
                onChange={(e) => setPdfPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleUnlockPdf() }}
                className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
              {passwordError && <p className="text-xs text-destructive text-center">{passwordError}</p>}
              <button onClick={handleUnlockPdf} className="mt-2 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                Unlock & Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR & Preview Modals */}
      {showQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm" onClick={() => setShowQr(false)}>
          <div className="glass relative flex max-w-sm flex-col items-center gap-4 rounded-3xl p-8" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setShowQr(false)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-semibold text-foreground">Scan to add a bill</h3>
            {qrDataUrl && <img src={qrDataUrl} alt="QR code" className="h-56 w-56 rounded-lg border border-border bg-card p-2" />}
            <p className="break-all text-center text-xs text-muted-foreground">{uploadUrl}</p>
          </div>
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={() => setPreview(null)}>
          <button type="button" onClick={() => setPreview(null)} className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg bg-background/80 text-foreground hover:bg-card">
            <X className="h-5 w-5" />
          </button>
          {preview.endsWith('.pdf') ? (
            <iframe src={preview} className="h-[90vh] w-full max-w-4xl rounded-xl bg-white" title="PDF Preview" onClick={(e) => e.stopPropagation()} />
          ) : (
            <img src={preview} alt="Bill full view" className="max-h-[90vh] max-w-full rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
          )}
        </div>
      )}
    </div>
  )
}