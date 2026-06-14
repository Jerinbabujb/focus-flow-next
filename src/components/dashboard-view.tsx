"use client"

import { useState } from "react"
import {
  Wallet,
  CreditCard,
  Flame,
  Users,
  TrendingUp,
  ListChecks,
  Receipt,
  CalendarClock,
  CheckSquare,
  ShoppingCart,
  HandCoins,
  Archive,
  X,
} from "lucide-react"
import { KpiCard } from "@/src/components/kpi-card"

const kpis = [
  {
    label: "Monthly Income",
    value: "$8,420",
    caption: "vs. $7,980 last month",
    change: 5.5,
    icon: Wallet,
  },
  {
    label: "Active Expenses",
    value: "$3,180",
    caption: "12 recurring charges",
    change: -2.3,
    icon: CreditCard,
  },
  {
    label: "Task Streak",
    value: "27 days",
    caption: "Personal best streak",
    change: 12.0,
    icon: Flame,
  },
  {
    label: "Total Group Debt",
    value: "$642",
    caption: "Across 4 groups",
    change: -8.1,
    icon: Users,
  },
]

const placeholders = [
  { title: "Spending Overview", icon: TrendingUp, span: "lg:col-span-2" },
  { title: "Upcoming Tasks", icon: ListChecks, span: "" },
  { title: "Recent Bills", icon: Receipt, span: "" },
  { title: "Debt Breakdown", icon: Users, span: "" },
  { title: "Schedule", icon: CalendarClock, span: "lg:col-span-2" },
]

const entryOptions = [
  { name: "Task", view: "Tasks", icon: CheckSquare, desc: "Add a to-do or reminder" },
  { name: "Grocery", view: "Groceries", icon: ShoppingCart, desc: "Add an item to your list" },
  { name: "Debt", view: "Debts", icon: HandCoins, desc: "Track money owed or lent" },
  { name: "Bill", view: "Bill Archive", icon: Archive, desc: "Save a bill or receipt" },
]

interface DashboardViewProps {
  onNavigate?: (name: string) => void
}

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const [showEntryModal, setShowEntryModal] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Friday, June 10</p>
          <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
            Good afternoon, Avery
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setShowEntryModal(true)}
          className="w-fit rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          New Entry
        </button>
      </header>

      {/* KPI grid */}
      <section aria-label="Key metrics">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>
      </section>

      {/* Placeholder content grid */}
      <section aria-label="Dashboard panels">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {placeholders.map((panel) => {
            const Icon = panel.icon
            return (
              <div
                key={panel.title}
                className={`glass flex min-h-56 flex-col gap-4 rounded-3xl p-5 ${panel.span}`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-foreground">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <h2 className="text-sm font-semibold">{panel.title}</h2>
                </div>

                {/* Skeleton placeholder rows */}
                <div className="flex flex-1 flex-col justify-center gap-3">
                  <div className="h-3 w-3/4 rounded-full bg-muted" />
                  <div className="h-3 w-1/2 rounded-full bg-muted" />
                  <div className="h-3 w-2/3 rounded-full bg-muted" />
                  <div className="h-3 w-2/5 rounded-full bg-muted" />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* New Entry modal */}
      {showEntryModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-entry-title"
        >
          <button
            type="button"
            aria-label="Close dialog"
            onClick={() => setShowEntryModal(false)}
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
          />
          <div className="glass relative z-10 w-full max-w-md rounded-3xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="new-entry-title" className="text-lg font-semibold tracking-tight">
                  New Entry
                </h2>
                <p className="text-sm text-muted-foreground">What would you like to add?</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEntryModal(false)}
                aria-label="Close"
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {entryOptions.map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.name}
                    type="button"
                    onClick={() => {
                      onNavigate?.(option.view)
                      setShowEntryModal(false)
                    }}
                    className="glass flex flex-col items-start gap-3 rounded-2xl p-4 text-left transition-colors hover:bg-secondary"
                  >
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="flex flex-col">
                      <span className="text-sm font-semibold">{option.name}</span>
                      <span className="text-xs text-muted-foreground">{option.desc}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
