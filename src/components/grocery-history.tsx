"use client"

import { useMemo, useState } from "react"
import { History, CalendarDays, ShoppingBasket, Check, ArrowLeft, Trash2 } from "lucide-react"
import { cn } from "@/src/lib/utils"

type Priority = "p1" | "p2" | "p3"

export interface HistoryItem {
  id: string
  name: string
  priority: Priority
  category: string
  quantity: number
  amount: number | null
  buyDate: string
  boughtAt: string
}

const formatMoney = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD" })

const formatFullDate = (iso: string) =>
  iso
    ? new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—"

const monthKey = (iso: string) => iso.slice(0, 7) // YYYY-MM
const monthLabel = (key: string) =>
  new Date(key + "-01T00:00:00").toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  })

interface GroceryHistoryProps {
  history: HistoryItem[]
  onBack: () => void
  onClear: () => void
}

export function GroceryHistory({ history, onBack, onClear }: GroceryHistoryProps) {
  const [mode, setMode] = useState<"day" | "month">("month")
  const [selectedDay, setSelectedDay] = useState("")
  const [selectedMonth, setSelectedMonth] = useState("")

  // Available months for the month filter dropdown
  const months = useMemo(() => {
    const set = new Set(history.map((h) => monthKey(h.boughtAt)))
    return Array.from(set).sort().reverse()
  }, [history])

  const filtered = useMemo(() => {
    if (mode === "day" && selectedDay) {
      return history.filter((h) => h.boughtAt === selectedDay)
    }
    if (mode === "month" && selectedMonth) {
      return history.filter((h) => monthKey(h.boughtAt) === selectedMonth)
    }
    return history
  }, [history, mode, selectedDay, selectedMonth])

  // group filtered results by month for display
  const grouped = useMemo(() => {
    const map = new Map<string, HistoryItem[]>()
    for (const item of filtered) {
      const key = monthKey(item.boughtAt)
      const arr = map.get(key) ?? []
      arr.push(item)
      map.set(key, arr)
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filtered])

  const totals = useMemo(() => {
    const qty = filtered.reduce((s, i) => s + i.quantity, 0)
    const amount = filtered.reduce((s, i) => s + (i.amount ?? 0), 0)
    return { qty, amount, count: filtered.length }
  }, [filtered])

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to groceries
        </button>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">What you&apos;ve already bought</p>
            <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
              Purchase history
            </h1>
          </div>
          {history.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="flex w-fit items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Clear all
            </button>
          )}
        </div>
      </header>

      {/* Filters */}
      <section aria-label="Filters" className="glass flex flex-col gap-4 rounded-3xl p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl bg-secondary p-1">
            <button
              type="button"
              onClick={() => setMode("month")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                mode === "month"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              By month
            </button>
            <button
              type="button"
              onClick={() => setMode("day")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                mode === "day"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              By date
            </button>
          </div>

          {mode === "month" ? (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-ring"
              aria-label="Filter by month"
            >
              <option value="">All months</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </select>
          ) : (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="size-4" aria-hidden="true" />
              <input
                type="date"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-ring"
                aria-label="Filter by date"
              />
            </label>
          )}

          {(selectedDay || selectedMonth) && (
            <button
              type="button"
              onClick={() => {
                setSelectedDay("")
                setSelectedMonth("")
              }}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Reset
            </button>
          )}
        </div>

        {/* Filtered totals */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-secondary/60 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Items</span>
            <span className="font-semibold">{totals.count}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-secondary/60 px-3 py-2 text-sm">
            <ShoppingBasket className="size-3.5 text-muted-foreground" aria-hidden="true" />
            <span className="font-semibold">{totals.qty}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-primary/15 px-3 py-2 text-sm text-primary">
            <span>Spent</span>
            <span className="font-semibold">{formatMoney(totals.amount)}</span>
          </div>
        </div>
      </section>

      {/* Results */}
      <section aria-label="History results" className="glass flex flex-col gap-5 rounded-3xl p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-foreground">
            <History className="size-4" aria-hidden="true" />
          </span>
          <h2 className="text-sm font-semibold">Bought items</h2>
        </div>

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {history.length === 0
              ? "Nothing here yet. Items you mark as bought will show up in history."
              : "No purchases match this filter."}
          </p>
        ) : (
          grouped.map(([key, monthItems]) => (
            <div key={key} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {monthLabel(key)}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {formatMoney(monthItems.reduce((s, i) => s + (i.amount ?? 0), 0))}
                </span>
              </div>
              <ul className="flex flex-col gap-2">
                {monthItems.map((item, idx) => (
                  <li
                    key={`${item.id}-${idx}`}
                    className="flex items-center gap-3 rounded-2xl bg-secondary/40 p-3"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                      <Check className="size-4" aria-hidden="true" />
                    </span>
                    <div className="flex flex-1 flex-col gap-1">
                      <span className="text-sm font-medium">{item.name}</span>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>{item.category}</span>
                        <span className="flex items-center gap-1">
                          <ShoppingBasket className="size-3" aria-hidden="true" />
                          {item.quantity}
                        </span>
                        {item.amount != null && <span>{formatMoney(item.amount)}</span>}
                        <span className="flex items-center gap-1">
                          <CalendarDays className="size-3" aria-hidden="true" />
                          {formatFullDate(item.boughtAt)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </div>
  )
}
