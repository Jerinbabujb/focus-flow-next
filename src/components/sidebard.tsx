"use client"

import { useState } from "react"
import {
  LayoutDashboard,
  CheckSquare,
  ShoppingCart,
  HandCoins,
  Archive,
  Wallet,
  Settings,
  Zap,
  LogOut,
  Menu,
  X
} from "lucide-react"
import { cn } from "@/src/lib/utils"
import { logoutAction } from "@/src/actions/auth"

const navItems = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Tasks", icon: CheckSquare },
  { name: "Groceries", icon: ShoppingCart },
  { name: "Debts", icon: HandCoins },
  { name: "Bill Archive", icon: Archive },
  { name: "Expenses", icon: Wallet },
]

interface SidebarProps {
  active: string
  onNavigate: (name: string) => void
  userName?: string
}

export function Sidebar({ active, onNavigate, userName = "User" }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Generate initials from the user's name (e.g., "Avery Moore" -> "AM")
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "U"

  const handleNavigate = (name: string) => {
    onNavigate(name)
    setIsMobileOpen(false) // Auto-close on mobile after clicking a link
  }

  return (
    <aside className={cn(
      "glass flex w-full flex-col rounded-3xl p-4 transition-all md:sticky md:top-4 md:h-[calc(100vh-2rem)] md:w-64",
      isMobileOpen ? "h-fit" : "h-[72px] md:h-[calc(100vh-2rem)] overflow-hidden md:overflow-visible"
    )}>
      {/* Brand & Mobile Toggle */}
      <div className="flex items-center justify-between px-2 pb-2 md:py-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Zap className="size-5" aria-hidden="true" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">Focus Flow</p>
            <p className="text-xs text-muted-foreground">Productivity Suite</p>
          </div>
        </div>
        
        {/* Mobile Hamburger Button */}
        <button 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="flex size-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary md:hidden"
        >
          {isMobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Collapsible Content */}
      <div className={cn("flex-1 flex-col", isMobileOpen ? "flex" : "hidden md:flex")}>
        {/* Navigation */}
        <nav className="mt-6 flex flex-col gap-1" aria-label="Primary">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = active === item.name
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => handleNavigate(item.name)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                <span>{item.name}</span>
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto pt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => handleNavigate("Settings")}
            aria-current={active === "Settings" ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active === "Settings"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Settings className="size-5 shrink-0" aria-hidden="true" />
            <span>Settings</span>
          </button>

          {/* User Profile & Logout */}
          <div className="glass flex items-center gap-3 rounded-2xl p-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
              {initials}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-medium">{userName}</p>
              <p className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">Pro plan</p>
            </div>
            <button
              onClick={() => logoutAction()}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
              title="Log Out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}