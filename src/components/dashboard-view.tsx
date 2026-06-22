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
  Flag,
} from "lucide-react"
import { KpiCard } from "@/src/components/kpi-card"
import { type Task } from "@/src/components/task-view"
import { cn } from "@/src/lib/utils"

const kpis = [
  { label: "Monthly Income", value: "$8,420", caption: "vs. $7,980 last month", change: 5.5, icon: Wallet },
  { label: "Active Expenses", value: "$3,180", caption: "12 recurring charges", change: -2.3, icon: CreditCard },
  { label: "Task Streak", value: "27 days", caption: "Personal best streak", change: 12.0, icon: Flame },
  { label: "Total Group Debt", value: "$642", caption: "Across 4 groups", change: -8.1, icon: Users },
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

// Map priorities to their visual styles
const priorityMeta: Record<string, { label: string; chip: string }> = {
  p1: { label: "P1", chip: "bg-chart-5/15 text-chart-5" },
  p2: { label: "P2", chip: "bg-chart-4/15 text-chart-4" },
  p3: { label: "P3", chip: "bg-chart-2/15 text-chart-2" },
}

interface DashboardViewProps {
  onNavigate?: (name: string) => void
  tasks?: Task[]
}

export function DashboardView({ onNavigate, tasks = [] }: DashboardViewProps) {
  const [showEntryModal, setShowEntryModal] = useState(false)

  // 1. Filter out completed tasks
  const pendingTasks = tasks.filter((t) => !t.completed)

  // 2. Calculate summary counts
  const p1Count = pendingTasks.filter((t) => t.priority === "p1").length
  const p2Count = pendingTasks.filter((t) => t.priority === "p2").length
  const p3Count = pendingTasks.filter((t) => t.priority === "p3").length

  // 3. Sort tasks by priority (p1 -> p2 -> p3)
  const sortedTasks = [...pendingTasks].sort((a, b) => {
    const weights: Record<string, number> = { p1: 1, p2: 2, p3: 3 }
    return weights[a.priority] - weights[b.priority]
  })

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

      {/* Content grid */}
      <section aria-label="Dashboard panels">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {placeholders.map((panel) => {
            const Icon = panel.icon
            return (
              <div
                key={panel.title}
                // Notice the strict h-[340px] here to prevent widget stretching
                className={cn(
                  "glass flex flex-col gap-4 rounded-3xl p-5 h-[340px]",
                  panel.span
                )}
              >
                <div className="flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-foreground">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <h2 className="text-sm font-semibold">{panel.title}</h2>
                  </div>
                  {panel.title === "Upcoming Tasks" && (
                    <button 
                      onClick={() => onNavigate?.("Tasks")}
                      className="text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      View all
                    </button>
                  )}
                </div>

                {panel.title === "Upcoming Tasks" ? (
                  <div className="flex min-h-0 flex-1 flex-col gap-3">
                    {/* Priority Summary Badges */}
                    <div className="flex shrink-0 flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wider">
                      <span className="rounded-md bg-secondary/80 px-2 py-1 text-muted-foreground">
                        Total: {pendingTasks.length}
                      </span>
                      {p1Count > 0 && (
                        <span className="rounded-md bg-chart-5/15 px-2 py-1 text-chart-5">
                          P1: {p1Count}
                        </span>
                      )}
                      {p2Count > 0 && (
                        <span className="rounded-md bg-chart-4/15 px-2 py-1 text-chart-4">
                          P2: {p2Count}
                        </span>
                      )}
                      {p3Count > 0 && (
                        <span className="rounded-md bg-chart-2/15 px-2 py-1 text-chart-2">
                          P3: {p3Count}
                        </span>
                      )}
                    </div>

                    {/* Scrollable Task List - Will now scroll because parent is h-[340px] */}
                    <div className="flex flex-col gap-2 overflow-y-auto pr-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/50 [&::-webkit-scrollbar]:w-1.5 hover:[&::-webkit-scrollbar-thumb]:bg-border">
                      {sortedTasks.length > 0 ? (
                        sortedTasks.map((task) => (
                          <div key={task.id} className="flex shrink-0 items-center justify-between gap-3 rounded-xl bg-secondary/50 px-3 py-2.5">
                            <span className="truncate text-sm font-medium">{task.title}</span>
                            
                            {/* Explicit Priority Badge */}
                            <span
                              className={cn(
                                "flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase",
                                priorityMeta[task.priority]?.chip
                              )}
                            >
                              <Flag className="size-3" aria-hidden="true" />
                              {priorityMeta[task.priority]?.label}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center text-muted-foreground">
                          <CheckSquare className="size-8 opacity-20" />
                          <p className="text-sm">No pending tasks!</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Skeleton placeholders */
                  <div className="flex flex-1 flex-col justify-center gap-3">
                    <div className="h-3 w-3/4 rounded-full bg-muted" />
                    <div className="h-3 w-1/2 rounded-full bg-muted" />
                    <div className="h-3 w-2/3 rounded-full bg-muted" />
                    <div className="h-3 w-2/5 rounded-full bg-muted" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* New Entry modal */}
      {showEntryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" onClick={() => setShowEntryModal(false)} className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
          <div className="glass relative z-10 w-full max-w-md rounded-3xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">New Entry</h2>
                <p className="text-sm text-muted-foreground">What would you like to add?</p>
              </div>
              <button type="button" onClick={() => setShowEntryModal(false)} className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {entryOptions.map((option) => (
                <button
                  key={option.name}
                  type="button"
                  onClick={() => {
                    onNavigate?.(option.view)
                    setShowEntryModal(false)
                  }}
                  className="glass flex flex-col items-start gap-3 rounded-2xl p-4 text-left hover:bg-secondary"
                >
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <option.icon className="size-5" />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold">{option.name}</span>
                    <span className="text-xs text-muted-foreground">{option.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}