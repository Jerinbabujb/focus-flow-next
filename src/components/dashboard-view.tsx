"use client"

import { useState } from "react"
import {
  Wallet, CreditCard, Flame, Users, TrendingUp, ListChecks, 
  Receipt, CheckSquare, ShoppingCart, HandCoins, Archive, X, Flag, 
  CalendarClock, Clock // Added Clock for the Future panel
} from "lucide-react"
import { KpiCard } from "@/src/components/kpi-card"
import { type Task } from "@/src/components/task-view"
import { cn } from "@/src/lib/utils"

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" })

const entryOptions = [
  { name: "Task", view: "Tasks", icon: CheckSquare, desc: "Add a to-do or reminder" },
  { name: "Grocery", view: "Groceries", icon: ShoppingCart, desc: "Add an item to your list" },
  { name: "Debt", view: "Debts", icon: HandCoins, desc: "Track money owed or lent" },
  { name: "Bill", view: "Bill Archive", icon: Archive, desc: "Save a bill or receipt" },
]

const priorityMeta: Record<string, { label: string; chip: string }> = {
  p1: { label: "P1", chip: "bg-chart-5/15 text-chart-5" },
  p2: { label: "P2", chip: "bg-chart-4/15 text-chart-4" },
  p3: { label: "P3", chip: "bg-chart-2/15 text-chart-2" },
}

interface DashboardViewProps {
  userName?: string
  onNavigate?: (name: string) => void
  tasks?: Task[]
  income?: number
  expenses?: any[]
  bills?: any[]
  debts?: any[]
  debtHistory?: any[]
  groceries?: any[]
  groceryHistory?: any[]
}

export function DashboardView({ 
  userName = "User", 
  onNavigate, 
  tasks = [],
  income = 0,
  expenses = [],
  bills = [],
  debts = [],
  debtHistory = [],
  groceries = [],
  groceryHistory = []
}: DashboardViewProps) {
  const [showEntryModal, setShowEntryModal] = useState(false)

  // --- 1. TASKS PROCESSING ---
  const pendingTasks = tasks.filter((t) => !t.completed)
  const p1Count = pendingTasks.filter((t) => t.priority === "p1").length
  const p2Count = pendingTasks.filter((t) => t.priority === "p2").length
  const p3Count = pendingTasks.filter((t) => t.priority === "p3").length

  const sortedTasks = [...pendingTasks].sort((a, b) => {
    const weights: Record<string, number> = { p1: 1, p2: 2, p3: 3 }
    return weights[a.priority] - weights[b.priority]
  })

  // --- 2. AGGREGATE COMPLETED EXPENSES ---
  // Normalize all data sources so they have a standard { title, amount, category, date }
  const mappedManual = expenses.map(e => ({ id: e.id, title: e.name, amount: e.amount, category: e.category, date: e.date, type: "expenses" }))
  const mappedBills = bills.map(b => ({ id: b.id, title: b.vendorName, amount: b.amount, category: "Bills", date: b.date, type: "bills" }))
  const mappedGroceryHistory = groceryHistory.map(g => ({ id: g.id, title: g.name, amount: g.amount || 0, category: "Food", date: g.boughtAt, type: "groceries" }))
  const mappedDebtHistory = debtHistory
    .filter(d => d.category === "to-give")
    .map(d => ({ id: d.id, title: `Paid: ${d.person}`, amount: d.amount, category: "Debt", date: d.settledAt, type: "debts" }))

  const allCompletedExpenses = [...mappedManual, ...mappedBills, ...mappedGroceryHistory, ...mappedDebtHistory]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // --- 3. AGGREGATE FUTURE EXPENSES ---
  const mappedPendingGroceries = groceries.map(g => ({ id: g.id, title: g.name, amount: g.amount || 0, category: "Food", date: g.buyDate, type: "groceries" }))
  const mappedPendingDebts = debts
    .filter(d => d.category === "to-give")
    .map(d => ({ id: d.id, title: `Owe: ${d.person}`, amount: d.amount, category: "Debt", date: d.date, type: "debts" }))

  const allFutureExpenses = [...mappedPendingGroceries, ...mappedPendingDebts]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Ascending (soonest first)

  // --- 4. MATH ---
  const totalCompletedExpenses = allCompletedExpenses.reduce((sum, e) => sum + e.amount, 0)
  const totalFutureExpenses = allFutureExpenses.reduce((sum, e) => sum + e.amount, 0)
  const totalDebtOwed = debts.filter(d => d.category === "to-give").reduce((sum, d) => sum + d.amount, 0)

  const dateString = new Date().toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' })

  // --- LIVE KPIs ---
  const kpis = [
    { label: "Monthly Income", value: money(income), caption: "Budget baseline", change: 0, icon: Wallet },
    { label: "Active Expenses", value: money(totalCompletedExpenses), caption: `${allCompletedExpenses.length} combined items`, change: 0, icon: CreditCard },
    { label: "Pending Tasks", value: `${pendingTasks.length}`, caption: "Needs your attention", change: 0, icon: Flame },
    { label: "Total Active Debt", value: money(totalDebtOwed), caption: "Owed to others", change: 0, icon: Users },
  ]

  // --- LIVE PANELS ---
  const placeholders = [
    { title: "Spending Overview", icon: TrendingUp, span: "lg:col-span-2", targetRoute: "Expenses", data: allCompletedExpenses.slice(0, 10) },
    { title: "Upcoming Tasks", icon: ListChecks, span: "", targetRoute: "Tasks", data: sortedTasks },
    // New Unified Future Panel
    { title: "Future Liabilities", icon: Clock, span: "", targetRoute: "Expenses", data: allFutureExpenses.slice(0, 5) },
    { title: "Recent Bills", icon: Receipt, span: "", targetRoute: "Bill Archive", data: mappedBills.slice(0, 5) },
    { title: "Pending Groceries", icon: ShoppingCart, span: "", targetRoute: "Groceries", data: mappedPendingGroceries.slice(0, 5) },
    { title: "Debt Breakdown", icon: Users, span: "", targetRoute: "Debts", data: mappedPendingDebts.slice(0, 5) },
  ]

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{dateString}</p>
          <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
            Good afternoon, {userName}
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

      <section aria-label="Key metrics">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>
      </section>

      <section aria-label="Dashboard panels">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {placeholders.map((panel) => {
            const Icon = panel.icon
            const hasData = panel.data && panel.data.length > 0

            return (
              <div key={panel.title} className={cn("glass flex flex-col gap-4 rounded-3xl p-5 h-[340px]", panel.span)}>
                <div className="flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-foreground">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <h2 className="text-sm font-semibold">{panel.title}</h2>
                  </div>
                  <button 
                    onClick={() => onNavigate?.(panel.targetRoute)}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    View all
                  </button>
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-3">
                  {panel.title === "Upcoming Tasks" && (
                    <div className="flex shrink-0 flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wider">
                      <span className="rounded-md bg-secondary/80 px-2 py-1 text-muted-foreground">Total: {pendingTasks.length}</span>
                      {p1Count > 0 && <span className="rounded-md bg-chart-5/15 px-2 py-1 text-chart-5">P1: {p1Count}</span>}
                      {p2Count > 0 && <span className="rounded-md bg-chart-4/15 px-2 py-1 text-chart-4">P2: {p2Count}</span>}
                      {p3Count > 0 && <span className="rounded-md bg-chart-2/15 px-2 py-1 text-chart-2">P3: {p3Count}</span>}
                    </div>
                  )}

                  <div className="flex flex-col gap-2 overflow-y-auto pr-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/50 [&::-webkit-scrollbar]:w-1.5 hover:[&::-webkit-scrollbar-thumb]:bg-border">
                    {hasData ? (
                      panel.data.map((item: any) => (
                        <div key={item.id} className="flex shrink-0 items-center justify-between gap-3 rounded-xl bg-secondary/50 px-3 py-2.5">
                          <div className="flex flex-col min-w-0">
                            <span className="truncate text-sm font-medium">
                              {item.title}
                            </span>
                            {panel.title !== "Upcoming Tasks" && (
                              <span className="truncate text-xs text-muted-foreground">
                                {item.category} · {item.date}
                              </span>
                            )}
                          </div>
                          
                          {panel.title === "Upcoming Tasks" ? (
                            <span className={cn("flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase", priorityMeta[item.priority]?.chip)}>
                              <Flag className="size-3" aria-hidden="true" />
                              {priorityMeta[item.priority]?.label}
                            </span>
                          ) : (
                            <span className="shrink-0 text-sm font-semibold tabular-nums">
                              {money(item.amount)}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center text-muted-foreground">
                        <Icon className="size-8 opacity-20" />
                        <p className="text-sm">Nothing pending here!</p>
                      </div>
                    )}
                  </div>
                </div>
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
                  className="glass flex flex-col items-start gap-3 rounded-2xl p-4 text-left hover:bg-secondary transition-colors"
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