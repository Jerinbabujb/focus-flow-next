"use client"

import { useMemo, useState } from "react"
import { History, CalendarDays, Check, ArrowLeft, Trash2, Repeat, Flag, Undo2 } from "lucide-react"
import { cn } from "@/src/lib/utils"

// Import the server actions
import { restoreTask, deleteArchivedTask, clearAllArchivedTasks } from "@/src/actions/task-history"

type Priority = "p1" | "p2" | "p3"
type RepeatOption = "none" | "daily" | "weekly" | "monthly"

export interface TaskHistoryItem {
  id: string
  title: string
  priority: Priority
  repeat: RepeatOption
  completedAt: string
}

const priorityMeta: Record<Priority, { label: string; chip: string }> = {
  p1: { label: "P1", chip: "bg-chart-5/15 text-chart-5" },
  p2: { label: "P2", chip: "bg-chart-4/15 text-chart-4" },
  p3: { label: "P3", chip: "bg-chart-2/15 text-chart-2" },
}

const repeatLabels: Record<RepeatOption, string> = {
  none: "No repeat",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
}

const formatFullDate = (iso: string) =>
  iso
    ? new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—"

const dayKey = (iso: string) => iso.split("T")[0] // YYYY-MM-DD
const monthKey = (iso: string) => iso.slice(0, 7) // YYYY-MM
const monthLabel = (key: string) =>
  new Date(key + "-01T00:00:00").toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  })

interface TaskHistoryProps {
  initialHistory: TaskHistoryItem[] // Changed to initialHistory for local state management
  onBack: () => void
}

export function TaskHistory({ initialHistory, onBack }: TaskHistoryProps) {
  // Wrap the prop in local state for optimistic updates
  const [history, setHistory] = useState<TaskHistoryItem[]>(initialHistory)
  const [mode, setMode] = useState<"day" | "month">("day")
  const [selectedDay, setSelectedDay] = useState("")
  const [selectedMonth, setSelectedMonth] = useState("")

 const handleRestore = (id: string) => {
    // 1. Optimistic UI update
    setHistory((prev) => prev.filter((t) => t.id !== id))
    // 2. Background sync
    restoreTask(id).catch(console.error)
  }

  const handleDelete = (id: string) => {
    // 1. Optimistic UI update
    setHistory((prev) => prev.filter((t) => t.id !== id))
    // 2. Background sync
    deleteArchivedTask(id).catch(console.error)
  }

  const handleClearAll = () => {
    // 1. Optimistic UI update
    setHistory([])
    // 2. Background sync
    clearAllArchivedTasks().catch(console.error)
  }
  // ---------------------------------------

  const months = useMemo(() => {
    const set = new Set(history.map((h) => monthKey(h.completedAt)))
    return Array.from(set).sort().reverse()
  }, [history])

  const filtered = useMemo(() => {
    if (mode === "day" && selectedDay) {
      return history.filter((h) => dayKey(h.completedAt) === selectedDay)
    }
    if (mode === "month" && selectedMonth) {
      return history.filter((h) => monthKey(h.completedAt) === selectedMonth)
    }
    return history
  }, [history, mode, selectedDay, selectedMonth])

  const grouped = useMemo(() => {
    const dayMap = new Map<string, TaskHistoryItem[]>()
    for (const item of filtered) {
      const key = dayKey(item.completedAt)
      const arr = dayMap.get(key) ?? []
      arr.push(item)
      dayMap.set(key, arr)
    }
    const sortedDays = Array.from(dayMap.entries()).sort((a, b) => b[0].localeCompare(a[0]))
    const monthMap = new Map<string, [string, TaskHistoryItem[]][]>()
    for (const [day, dayItems] of sortedDays) {
      const mk = monthKey(day)
      const arr = monthMap.get(mk) ?? []
      arr.push([day, dayItems])
      monthMap.set(mk, arr)
    }
    return Array.from(monthMap.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filtered])

  const counts = useMemo(() => {
    return filtered.reduce(
      (acc, t) => {
        acc[t.priority] += 1
        return acc
      },
      { p1: 0, p2: 0, p3: 0 } as Record<Priority, number>,
    )
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
          Back to tasks
        </button>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Everything you&apos;ve completed</p>
            <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
              Task history
            </h1>
          </div>
          {history.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
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
              onClick={() => setMode("day")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                mode === "day" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              By date
            </button>
            <button
              type="button"
              onClick={() => setMode("month")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                mode === "month" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              By month
            </button>
          </div>

          {mode === "day" ? (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="size-4" aria-hidden="true" />
              <input
                type="date"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
          ) : (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All months</option>
              {months.map((m) => (
                <option key={m} value={m}>{monthLabel(m)}</option>
              ))}
            </select>
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
            <span className="text-muted-foreground">Completed</span>
            <span className="font-semibold">{filtered.length}</span>
          </div>
          {(["p1", "p2", "p3"] as Priority[]).map((p) => (
            <div
              key={p}
              className={cn("flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold", priorityMeta[p].chip)}
            >
              <Flag className="size-3.5" aria-hidden="true" />
              {priorityMeta[p].label}
              <span>{counts[p]}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Results */}
      <section aria-label="History results" className="glass flex flex-col gap-6 rounded-3xl p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-foreground">
            <History className="size-4" aria-hidden="true" />
          </span>
          <h2 className="text-sm font-semibold">Completed tasks</h2>
        </div>

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {history.length === 0
              ? "Nothing here yet. Tasks you complete will show up in history."
              : "No completed tasks match this filter."}
          </p>
        ) : (
          grouped.map(([mk, days]) => (
            <div key={mk} className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {monthLabel(mk)}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {days.reduce((s, [, items]) => s + items.length, 0)} completed
                </span>
              </div>

              {days.map(([day, dayItems]) => (
                <div key={day} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 pl-1">
                    <CalendarDays className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    <h4 className="text-xs font-medium text-muted-foreground">{formatFullDate(day)}</h4>
                    <span className="text-xs text-muted-foreground">({dayItems.length})</span>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {dayItems.map((item, idx) => (
                      <li
                        key={`${item.id}-${idx}`}
                        className="flex items-center gap-3 rounded-2xl bg-secondary/40 p-3"
                      >
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/20 text-primary">
                          <Check className="size-4" aria-hidden="true" />
                        </span>
                        
                        <div className="flex flex-1 flex-col gap-1">
                          <span className="text-sm font-medium text-muted-foreground line-through">{item.title}</span>
                          {item.repeat !== "none" && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Repeat className="size-3" aria-hidden="true" />
                              {repeatLabels[item.repeat]}
                            </span>
                          )}
                        </div>

                        <span className={cn("flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", priorityMeta[item.priority].chip)}>
                          <Flag className="size-3.5" aria-hidden="true" />
                          {priorityMeta[item.priority].label}
                        </span>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 ml-2">
                          <button
                            type="button"
                            onClick={() => handleRestore(item.id)}
                            className="flex items-center justify-center rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            aria-label="Restore task"
                            title="Restore task"
                          >
                            <Undo2 className="size-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="flex items-center justify-center rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                            aria-label="Delete task permanently"
                            title="Delete task permanently"
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </button>
                        </div>

                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))
        )}
      </section>
    </div>
  )
}