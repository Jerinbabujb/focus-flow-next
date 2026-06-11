"use client"

import { useState, useRef, useEffect } from "react"
import useSWR from "swr"
import QRCode from "qrcode"
import {
  Archive,
  ImagePlus,
  Camera,
  QrCode,
  Loader2,
  Trash2,
  X,
  RefreshCw,
  Smartphone,
  Receipt,
} from "lucide-react"

interface BillFile {
  pathname: string
  filename: string
  size: number
  uploadedAt: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const fileUrl = (pathname: string) =>
  `/api/bills/file?pathname=${encodeURIComponent(pathname)}`

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

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
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const url = `${window.location.origin}/upload-bill`
    setUploadUrl(url)
    QRCode.toDataURL(url, { width: 240, margin: 1 })
      .then(setQrDataUrl)
      .catch((err) => console.error("[v0] QR generation error:", err))
  }, [])

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError("")
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("source", "desktop")
      const res = await fetch("/api/bills/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")
      await mutate()
    } catch (err) {
      console.error("[v0] desktop upload error:", err)
      setUploadError("Could not upload the image. Please try again.")
    } finally {
      setUploading(false)
      e.target.value = ""
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
      <div className="glass-panel flex flex-col gap-1 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Archive className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-balance text-xl font-semibold text-foreground">Bill Archive</h1>
            <p className="text-sm text-muted-foreground">
              Upload bill photos or scan the code to add them from your phone
            </p>
          </div>
        </div>
      </div>

      {/* Add bill section */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Direct upload */}
        <div className="glass-panel flex flex-col gap-4 rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <ImagePlus className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Add from this device</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              disabled={uploading}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card/50 py-6 text-sm font-medium text-foreground transition-colors hover:bg-card disabled:opacity-60"
            >
              <Camera className="h-6 w-6 text-primary" />
              Take photo
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              disabled={uploading}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card/50 py-6 text-sm font-medium text-foreground transition-colors hover:bg-card disabled:opacity-60"
            >
              <ImagePlus className="h-6 w-6 text-primary" />
              Choose image
            </button>
          </div>
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleSelect}
            className="hidden"
          />
          <input ref={galleryRef} type="file" accept="image/*" onChange={handleSelect} className="hidden" />
          {uploading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
            </p>
          )}
          {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
        </div>

        {/* QR - desktop only */}
        <div className="glass-panel hidden flex-col gap-4 rounded-2xl p-5 lg:flex">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Add from your phone</h2>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowQr(true)}
              className="flex h-28 w-28 shrink-0 items-center justify-center rounded-xl border border-border bg-card p-2 transition-transform hover:scale-105"
              aria-label="Show QR code to open uploader on phone"
            >
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl || "/placeholder.svg"} alt="QR code to open uploader on phone" className="h-full w-full" />
              ) : (
                <QrCode className="h-8 w-8 text-muted-foreground" />
              )}
            </button>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <p className="text-pretty">
                Scan this code with your phone camera to open the uploader, then take a photo or pick an image.
              </p>
              <button
                type="button"
                onClick={() => setShowQr(true)}
                className="self-start text-sm font-medium text-primary hover:underline"
              >
                Enlarge code
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Saved bills */}
      <div className="glass-panel flex flex-col gap-4 rounded-2xl p-5">
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
            className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-card"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading bills…
          </div>
        ) : bills.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Archive className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">No bills yet</p>
            <p className="text-sm text-muted-foreground">Upload an image or scan the QR code to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {bills.map((bill) => (
              <div
                key={bill.pathname}
                className="group relative overflow-hidden rounded-xl border border-border bg-card/50"
              >
                <button
                  type="button"
                  onClick={() => setPreview(fileUrl(bill.pathname))}
                  className="block aspect-[3/4] w-full overflow-hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fileUrl(bill.pathname) || "/placeholder.svg"}
                    alt={bill.filename}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(bill.pathname)}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-background/80 text-destructive opacity-0 backdrop-blur transition-opacity hover:bg-background group-hover:opacity-100"
                  aria-label={`Delete ${bill.filename}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <div className="flex flex-col gap-0.5 p-2.5">
                  <p className="truncate text-xs font-medium text-foreground">{bill.filename}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatDate(bill.uploadedAt)} · {formatSize(bill.size)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR modal */}
      {showQr && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm"
          onClick={() => setShowQr(false)}
        >
          <div
            className="glass-panel relative flex max-w-sm flex-col items-center gap-4 rounded-2xl p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowQr(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-semibold text-foreground">Scan to add a bill</h3>
            {qrDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl || "/placeholder.svg"} alt="QR code" className="h-56 w-56 rounded-lg border border-border bg-card p-2" />
            )}
            <p className="break-all text-center text-xs text-muted-foreground">{uploadUrl}</p>
            <p className="text-center text-sm text-muted-foreground text-pretty">
              Open your phone camera and point it at the code. New photos appear here automatically.
            </p>
          </div>
        </div>
      )}

      {/* Image preview modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          onClick={() => setPreview(null)}
        >
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg bg-background/80 text-foreground hover:bg-card"
            aria-label="Close preview"
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview || "/placeholder.svg"}
            alt="Bill full view"
            className="max-h-[90vh] max-w-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
