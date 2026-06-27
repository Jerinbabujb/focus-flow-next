"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

export type ThemeMode = "light" | "dark"
export type FontKey = "sans" | "serif" | "mono"
export type FontSizeKey = "sm" | "md" | "lg" | "xl"

interface AppSettings {
  mode: ThemeMode
  /** Accent stored as a hex string, e.g. "#14b8a6" */
  accent: string
  font: FontKey
  fontSize: FontSizeKey
}

interface SettingsContextValue extends AppSettings {
  setMode: (m: ThemeMode) => void
  toggleMode: () => void
  setAccent: (hex: string) => void
  setFont: (f: FontKey) => void
  setFontSize: (s: FontSizeKey) => void
}

export const ACCENT_PRESETS: { key: string; label: string; hex: string }[] = [
  { key: "teal", label: "Teal", hex: "#14b8a6" },
  { key: "blue", label: "Blue", hex: "#3b82f6" },
  { key: "green", label: "Green", hex: "#22c55e" },
  { key: "amber", label: "Amber", hex: "#f59e0b" },
  { key: "rose", label: "Rose", hex: "#f43f5e" },
  { key: "violet", label: "Violet", hex: "#8b5cf6" },
]

export const FONTS: Record<FontKey, { label: string; stack: string }> = {
  sans: { label: "Sans", stack: "var(--font-geist-sans), 'Geist Fallback', sans-serif" },
  serif: { label: "Serif", stack: "Georgia, 'Times New Roman', serif" },
  mono: { label: "Mono", stack: "var(--font-geist-mono), 'Geist Mono Fallback', monospace" },
}

export const FONT_SIZES: Record<FontSizeKey, { label: string; px: string }> = {
  sm: { label: "Small", px: "14px" },
  md: { label: "Medium", px: "16px" },
  lg: { label: "Large", px: "18px" },
  xl: { label: "Extra large", px: "20px" },
}

const DEFAULTS: AppSettings = { mode: "dark", accent: "#14b8a6", font: "sans", fontSize: "md" }
const STORAGE_KEY = "flux-settings"

const SettingsContext = createContext<SettingsContextValue | null>(null)

/* ------------------------- color helpers ------------------------- */

export function isValidHex(hex: string): boolean {
  return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex.trim())
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let c = hex.replace("#", "").trim()
  if (c.length === 3) c = c.split("").map((x) => x + x).join("")
  const r = parseInt(c.slice(0, 2), 16) / 255
  const g = parseInt(c.slice(2, 4), 16) / 255
  const b = parseInt(c.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  let h = 0
  let s = 0
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1))
    switch (max) {
      case r:
        h = ((g - b) / d) % 6
        break
      case g:
        h = (b - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
    }
    h *= 60
    if (h < 0) h += 360
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sN = s / 100
  const lN = l / 100
  const c = (1 - Math.abs(2 * lN - 1)) * sN
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = lN - c / 2
  let r = 0
  let g = 0
  let b = 0
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255]
}

/** Relative luminance per WCAG, used to choose a readable foreground. */
function luminance(h: number, s: number, l: number): number {
  const rgb = hslToRgb(h, s, l).map((v) => {
    const x = v / 255
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
}

/** Pick black or white text so it stays readable on the given color. */
function readableFg(h: number, s: number, l: number): string {
  return luminance(h, s, l) > 0.45 ? "hsl(240, 12%, 12%)" : "hsl(0, 0%, 100%)"
}

const hsl = (h: number, s: number, l: number) => `hsl(${h}, ${s}%, ${l}%)`
const hsla = (h: number, s: number, l: number, a: number) => `hsla(${h}, ${s}%, ${l}%, ${a})`

function buildTokens(accentHex: string, mode: ThemeMode): Record<string, string> {
  const { h, s } = hexToHsl(isValidHex(accentHex) ? accentHex : "#14b8a6")
  // Keep the accent vivid but not neon.
  const sat = Math.min(Math.max(s, 45), 90)

  if (mode === "light") {
    const sBg = Math.min(sat, 55)
    const primaryL = 45
    const primaryFg = readableFg(h, sat, primaryL)
    return {
      "--background": hsl(h, Math.round(sBg * 0.45), 97),
      "--foreground": hsl(h, 22, 16),
      "--card": hsla(h, Math.round(sBg * 0.5), 100, 0.7),
      "--card-foreground": hsl(h, 22, 16),
      "--popover": hsl(h, Math.round(sBg * 0.4), 99),
      "--popover-foreground": hsl(h, 22, 16),
      "--primary": hsl(h, sat, primaryL),
      "--primary-foreground": primaryFg,
      "--secondary": hsla(h, Math.round(sBg * 0.5), 90, 0.75),
      "--secondary-foreground": hsl(h, 22, 18),
      "--muted": hsla(h, Math.round(sBg * 0.4), 92, 0.6),
      "--muted-foreground": hsl(h, 14, 38),
      "--accent": hsla(h, sat, 45, 0.14),
      "--accent-foreground": hsl(h, 55, 28),
      "--destructive": "hsl(2, 72%, 48%)",
      "--border": hsla(h, 25, 30, 0.16),
      "--input": hsla(h, 25, 30, 0.2),
      "--ring": hsl(h, sat, primaryL),
      "--sidebar": hsla(h, Math.round(sBg * 0.5), 99, 0.7),
      "--sidebar-foreground": hsl(h, 22, 16),
      "--sidebar-primary": hsl(h, sat, primaryL),
      "--sidebar-primary-foreground": primaryFg,
      "--sidebar-accent": hsla(h, sat, 45, 0.16),
      "--sidebar-accent-foreground": hsl(h, 55, 28),
      "--sidebar-border": hsla(h, 25, 30, 0.16),
      "--sidebar-ring": hsl(h, sat, primaryL),
      "--backdrop-base": hsl(h, Math.round(sBg * 0.5), 95),
      "--backdrop-image": [
        `radial-gradient(45rem 45rem at 5% -10%, ${hsla(h, sat, 70, 0.35)}, transparent 60%)`,
        `radial-gradient(42rem 42rem at 108% 5%, ${hsla((h + 40) % 360, sat, 72, 0.28)}, transparent 55%)`,
        `radial-gradient(40rem 40rem at 80% 115%, ${hsla((h + 320) % 360, sat, 74, 0.25)}, transparent 55%)`,
      ].join(", "),
    }
  }

  // dark mode — keep it genuinely dark/near-black, with only a faint accent tint
  const sBg = Math.min(sat, 70)
  const primaryL = 66
  const primaryFg = readableFg(h, sat, primaryL)
  return {
    "--background": hsl(h, Math.round(sBg * 0.25), 5),
    "--foreground": hsl(h, 8, 97),
    "--card": hsla(h, Math.round(sBg * 0.25), 16, 0.55),
    "--card-foreground": hsl(h, 8, 97),
    "--popover": hsl(h, Math.round(sBg * 0.25), 8),
    "--popover-foreground": hsl(h, 8, 97),
    "--primary": hsl(h, sat, primaryL),
    "--primary-foreground": primaryFg,
    "--secondary": hsla(h, Math.round(sBg * 0.2), 24, 0.5),
    "--secondary-foreground": hsl(h, 8, 97),
    "--muted": hsla(h, Math.round(sBg * 0.2), 22, 0.4),
    "--muted-foreground": hsl(h, 8, 70),
    "--accent": hsla(h, sat, 65, 0.2),
    "--accent-foreground": hsl(h, 45, 85),
    "--destructive": "hsl(8, 72%, 60%)",
    "--border": hsla(h, 14, 92, 0.1),
    "--input": hsla(h, 14, 92, 0.14),
    "--ring": hsl(h, sat, primaryL),
    "--sidebar": hsla(h, Math.round(sBg * 0.25), 7, 0.6),
    "--sidebar-foreground": hsl(h, 8, 97),
    "--sidebar-primary": hsl(h, sat, primaryL),
    "--sidebar-primary-foreground": primaryFg,
    "--sidebar-accent": hsla(h, sat, 65, 0.2),
    "--sidebar-accent-foreground": hsl(h, 45, 85),
    "--sidebar-border": hsla(h, 14, 92, 0.1),
    "--sidebar-ring": hsl(h, sat, primaryL),
    "--backdrop-base": hsl(h, Math.round(sBg * 0.3), 5),
    "--backdrop-image": [
      `radial-gradient(45rem 45rem at 5% -10%, ${hsla(h, sat, 45, 0.22)}, transparent 55%)`,
      `radial-gradient(42rem 42rem at 108% 5%, ${hsla((h + 40) % 360, sat, 42, 0.16)}, transparent 50%)`,
      `radial-gradient(40rem 40rem at 80% 115%, ${hsla((h + 320) % 360, sat, 44, 0.14)}, transparent 50%)`,
    ].join(", "),
  }
}

function applySettings(settings: AppSettings) {
  const root = document.documentElement
  root.classList.toggle("dark", settings.mode === "dark")
  const tokens = buildTokens(settings.accent, settings.mode)
  for (const [key, val] of Object.entries(tokens)) {
    root.style.setProperty(key, val)
  }
  root.style.setProperty("--font-sans", FONTS[settings.font].stack)
  root.style.fontSize = FONT_SIZES[settings.fontSize].px
  root.style.colorScheme = settings.mode
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS)

  // Load persisted prefs once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = { ...DEFAULTS, ...JSON.parse(raw) } as AppSettings
        setSettings(parsed)
        applySettings(parsed)
        return
      }
    } catch {
      // ignore malformed storage
    }
    applySettings(DEFAULTS)
  }, [])

  // Apply + persist on every change.
  useEffect(() => {
    applySettings(settings)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // ignore quota errors
    }
  }, [settings])

  const value: SettingsContextValue = {
    ...settings,
    setMode: (mode) => setSettings((s) => ({ ...s, mode })),
    toggleMode: () => setSettings((s) => ({ ...s, mode: s.mode === "dark" ? "light" : "dark" })),
    setAccent: (accent) => setSettings((s) => ({ ...s, accent })),
    setFont: (font) => setSettings((s) => ({ ...s, font })),
    setFontSize: (fontSize) => setSettings((s) => ({ ...s, fontSize })),
  }

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider")
  return ctx
}
