"use client"

import {
  LayoutDashboard,
  CheckSquare,
  ShoppingCart,
  HandCoins,
  Archive,
  Wallet,
  Settings,
  Zap,
} from "lucide-react"
import { cn } from "@/src/lib/utils"

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
}

export function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside className="glass flex w-full flex-col rounded-3xl p-4 md:sticky md:top-4 md:h-[calc(100vh-2rem)] md:w-64">
      {/* Brand */}
      <div className="flex items-center gap-3 px-2 py-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Zap className="size-5" aria-hidden="true" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight">Flux</p>
          <p className="text-xs text-muted-foreground">Productivity Suite</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6 flex flex-col gap-1" aria-label="Primary">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = active === item.name
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => onNavigate(item.name)}
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
      <div className="mt-auto flex flex-col gap-3">
        <button
          type="button"
          onClick={() => onNavigate("Settings")}
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

        <div className="glass flex items-center gap-3 rounded-2xl p-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
            AM
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium">Avery Moore</p>
            <p className="truncate text-xs text-muted-foreground">Pro plan</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
