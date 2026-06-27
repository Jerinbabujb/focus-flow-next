"use client"

import { useState, useEffect } from "react"
import { Moon, Sun, Palette, Type, Scaling, Check } from "lucide-react"
import { cn } from "@/src/lib/utils"
import { 
  useSettings, 
  ACCENT_PRESETS, 
  FONTS, 
  FONT_SIZES, 
  isValidHex,
  type ThemeMode,
  type FontKey,
  type FontSizeKey
} from "@/src/components/settings-provider" // Adjust this path if you saved it elsewhere!
import { logoutAction } from "@/src/actions/auth"
import { LogOut } from "lucide-react"
export function SettingsView() {
  const { 
    mode, setMode, 
    accent, setAccent, 
    font, setFont, 
    fontSize, setFontSize 
  } = useSettings()

  const [customHex, setCustomHex] = useState(accent)

  // Keep local custom hex input in sync if accent changes externally
  useEffect(() => {
    setCustomHex(accent)
  }, [accent])

  const handleCustomHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setCustomHex(val)
    if (isValidHex(val)) {
      setAccent(val)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Customize your experience</p>
          <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
            Settings
          </h1>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Appearance (Theme) */}
        <section className="glass flex flex-col gap-5 rounded-3xl p-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-foreground">
              <Sun className="size-4 dark:hidden" />
              <Moon className="size-4 hidden dark:block" />
            </span>
            <h2 className="text-base font-semibold">Appearance</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {(["light", "dark"] as ThemeMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl border-2 py-4 text-sm font-medium capitalize transition-all",
                  mode === m 
                    ? "border-primary bg-primary/10 text-primary" 
                    : "border-transparent bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {m === "light" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                {m}
              </button>
            ))}
          </div>
        </section>

        {/* Accent Color */}
        <section className="glass flex flex-col gap-5 rounded-3xl p-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-foreground">
              <Palette className="size-4" />
            </span>
            <h2 className="text-base font-semibold">Accent Color</h2>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {ACCENT_PRESETS.map((preset) => {
              const isSelected = accent.toLowerCase() === preset.hex.toLowerCase()
              return (
                <button
                  key={preset.key}
                  onClick={() => setAccent(preset.hex)}
                  title={preset.label}
                  style={{ backgroundColor: preset.hex }}
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full shadow-sm transition-transform hover:scale-110 ring-offset-background",
                    isSelected ? "ring-2 ring-foreground ring-offset-2 scale-110" : ""
                  )}
                >
                  {isSelected && <Check className="size-4 text-white drop-shadow-md" />}
                </button>
              )
            })}
          </div>

          <div className="mt-2 flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Custom HEX:</span>
            <input 
              type="text" 
              value={customHex}
              onChange={handleCustomHexChange}
              placeholder="#FFFFFF"
              className="w-32 rounded-lg border border-border bg-secondary px-3 py-1.5 text-sm uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </section>

        {/* Typography (Font Family) */}
        <section className="glass flex flex-col gap-5 rounded-3xl p-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-foreground">
              <Type className="size-4" />
            </span>
            <h2 className="text-base font-semibold">Typography</h2>
          </div>
          
          <div className="flex flex-col gap-2">
            {(Object.keys(FONTS) as FontKey[]).map((fKey) => {
              const isSelected = font === fKey
              return (
                <button
                  key={fKey}
                  onClick={() => setFont(fKey)}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-4 py-3 text-left transition-colors",
                    isSelected ? "bg-primary/10 text-primary font-bold" : "hover:bg-secondary"
                  )}
                >
                  <span style={{ fontFamily: FONTS[fKey].stack }}>{FONTS[fKey].label}</span>
                  {isSelected && <Check className="size-4" />}
                </button>
              )
            })}
          </div>
        </section>

        {/* Font Size */}
        <section className="glass flex flex-col gap-5 rounded-3xl p-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-foreground">
              <Scaling className="size-4" />
            </span>
            <h2 className="text-base font-semibold">Scaling</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(Object.keys(FONT_SIZES) as FontSizeKey[]).map((sKey) => {
              const isSelected = fontSize === sKey
              return (
                <button
                  key={sKey}
                  onClick={() => setFontSize(sKey)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 rounded-xl border-2 py-3 transition-colors",
                    isSelected 
                      ? "border-primary bg-primary/10 text-primary" 
                      : "border-transparent bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <span className="text-xs font-medium uppercase tracking-wider">{sKey}</span>
                  <span className="text-[10px] opacity-70">{FONT_SIZES[sKey].px}</span>
                </button>
              )
            })}
          </div>
        </section>
{/* Account Settings */}
      <section className="glass flex flex-col gap-5 rounded-3xl p-6 mt-4 border-destructive/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Account</h2>
            <p className="text-sm text-muted-foreground">Manage your session</p>
          </div>
          <button
            onClick={() => logoutAction()}
            className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
          >
            <LogOut className="size-4" />
            Sign Out
          </button>
        </div>
      </section>
      </div>
    </div>
  )
}