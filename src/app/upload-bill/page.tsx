"use client"

import { useState, useRef } from "react"
import { Camera, ImagePlus, CheckCircle2, Loader2, Receipt } from "lucide-react"

export default function UploadBillPage() {
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [label, setLabel] = useState("")
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle")
  const [error, setError] = useState("")
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
    setStatus("idle")
    setError("")
  }

  const handleUpload = async () => {
    if (!file) return
    setStatus("uploading")
    setError("")
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("label", label)
      formData.append("source", "mobile")
      const res = await fetch("/api/bills/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")
      setStatus("done")
    } catch (err) {
      console.error("[v0] mobile upload error:", err)
      setStatus("error")
      setError("Could not upload. Please try again.")
    }
  }

  const reset = () => {
    setPreview(null)
    setFile(null)
    setLabel("")
    setStatus("idle")
    setError("")
  }

  return (
    <main className="app-backdrop flex min-h-screen flex-col items-center px-4 py-8">
      <div className="glass-panel w-full max-w-md rounded-2xl p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Add a bill</h1>
            <p className="text-sm text-muted-foreground">Take a photo or pick from your library</p>
          </div>
        </div>

        {status === "done" ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <CheckCircle2 className="h-14 w-14 text-primary" />
            <div>
              <p className="text-base font-medium text-foreground">Bill uploaded</p>
              <p className="text-sm text-muted-foreground">It will appear on your desktop shortly.</p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="mt-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Add another
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {preview ? (
              <div className="overflow-hidden rounded-xl border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview || "/placeholder.svg"} alt="Bill preview" className="max-h-72 w-full object-contain" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => cameraRef.current?.click()}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card/50 py-6 text-sm font-medium text-foreground transition-colors hover:bg-card"
                >
                  <Camera className="h-6 w-6 text-primary" />
                  Take photo
                </button>
                <button
                  type="button"
                  onClick={() => galleryRef.current?.click()}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card/50 py-6 text-sm font-medium text-foreground transition-colors hover:bg-card"
                >
                  <ImagePlus className="h-6 w-6 text-primary" />
                  Choose image
                </button>
              </div>
            )}

            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleSelect}
              className="hidden"
            />
            <input ref={galleryRef} type="file" accept="image/*" onChange={handleSelect} className="hidden" />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="label" className="text-sm font-medium text-foreground">
                Label (optional)
              </label>
              <input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Electricity, Groceries"
                className="rounded-lg border border-border bg-card/50 px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {preview && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={reset}
                  className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-card"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={status === "uploading"}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {status === "uploading" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading
                    </>
                  ) : (
                    "Upload bill"
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">Connected to your bill archive</p>
    </main>
  )
}
