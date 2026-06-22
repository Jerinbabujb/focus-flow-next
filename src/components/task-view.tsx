"use client"

import { useMemo, useState } from "react"
import {
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Repeat,
  ListChecks,
  Flag,
  History,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/src/lib/utils" // Adjusted to match your src path
import { TaskHistory, type TaskHistoryItem } from "@/src/components/task-history"

// Import Server Actions
import { 
  createTasks, 
  toggleTaskCompletion, 
  updateTaskDetails, 
  deleteTaskAction 
} from "@/src/actions/tasks"

type Priority = "p1" | "p2" | "p3"
type RepeatOption = "none" | "daily" | "weekly" | "monthly"

export interface Task {
  id: string
  title: string
  priority: Priority
  repeat: RepeatOption
  completed: boolean
}

interface DraftRow {
  id: string
  title: string
  priority: Priority
  repeat: RepeatOption
}

const priorityMeta: Record<Priority, { label: string; dot: string; chip: string }> = {
  p1: { label: "P1", dot: "bg-chart-5", chip: "bg-chart-5/15 text-chart-5" },
  p2: { label: "P2", dot: "bg-chart-4", chip: "bg-chart-4/15 text-chart-4" },
  p3: { label: "P3", dot: "bg-chart-2", chip: "bg-chart-2/15 text-chart-2" },
}

const repeatLabels: Record<RepeatOption, string> = {
  none: "No repeat",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
}

const today = () => new Date().toISOString().slice(0, 10)

let idCounter = 0
// Using "temp-task" prevents sending fake IDs to the database before it assigns a real UUID
const nextId = () => `temp-task-${Date.now()}-${idCounter++}`

type SubView = "list" | "history"

function PrioritySelect({ value, onChange, id }: { value: Priority; onChange: (p: Priority) => void; id?: string }) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as Priority)}
      className="rounded-lg border border-border bg-secondary px-2.5 py-2 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-ring"
      aria-label="Priority"
    >
      <option value="p1">P1 — High</option>
      <option value="p2">P2 — Medium</option>
      <option value="p3">P3 — Low</option>
    </select>
  )
}

function RepeatSelect({ value, onChange, id }: { value: RepeatOption; onChange: (r: RepeatOption) => void; id?: string }) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as RepeatOption)}
      className="rounded-lg border border-border bg-secondary px-2.5 py-2 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-ring"
      aria-label="Repeat"
    >
      <option value="none">No repeat</option>
      <option value="daily">Daily</option>
      <option value="weekly">Weekly</option>
      <option value="monthly">Monthly</option>
    </select>
  )
}

// Added props here so the parent page can pass down the real database items
interface TasksViewProps {
  initialTasks?: Task[]
  initialHistory?: TaskHistoryItem[]
}

export function TasksView({ initialTasks = [], initialHistory = [] }: TasksViewProps) {
  const [view, setView] = useState<SubView>("list")
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [history, setHistory] = useState<TaskHistoryItem[]>(initialHistory)

  // Multi-row add composer
  const [drafts, setDrafts] = useState<DraftRow[]>([
    { id: nextId(), title: "", priority: "p2", repeat: "none" },
  ])

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{
    title: string
    priority: Priority
    repeat: RepeatOption
  }>({ title: "", priority: "p2", repeat: "none" })

  const counts = useMemo(() => {
    return tasks.reduce(
      (acc, t) => {
        acc[t.priority] += 1
        return acc
      },
      { p1: 0, p2: 0, p3: 0 } as Record<Priority, number>,
    )
  }, [tasks])

  // --- Draft handlers ---
  const updateDraft = (id: string, patch: Partial<DraftRow>) => {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)))
  }

  const addDraftRow = () => {
    setDrafts((prev) => [
      ...prev,
      { id: nextId(), title: "", priority: "p2", repeat: "none" },
    ])
  }

  const removeDraftRow = (id: string) => {
    setDrafts((prev) =>
      prev.length === 1 ? prev : prev.filter((d) => d.id !== id),
    )
  }

  const addAllDrafts = () => {
    const valid = drafts.filter((d) => d.title.trim() !== "")
    if (valid.length === 0) return

    // 1. Optimistic UI Update
    const newTasks = valid.map((d) => ({
      id: nextId(),
      title: d.title.trim(),
      priority: d.priority,
      repeat: d.repeat,
      completed: false,
    }))
    setTasks((prev) => [...newTasks, ...prev])
    setDrafts([{ id: nextId(), title: "", priority: "p2", repeat: "none" }])

    // 2. Background DB Sync
    createTasks(valid).catch(console.error)
  }

  // --- Task handlers ---
  const completeTask = (id: string) => {
    const found = tasks.find((t) => t.id === id)
    if (!found) return

    // 1. Optimistic UI Update: Move to history and handle recurrence
    setHistory((prev) => [
      {
        id: found.id,
        title: found.title,
        priority: found.priority,
        repeat: found.repeat,
        completedAt: today(),
      },
      ...prev,
    ])

    setTasks((prev) => {
      if (found.repeat !== "none") {
        return prev.map((t) => (t.id === id ? { ...t, completed: false } : t))
      }
      return prev.filter((t) => t.id !== id)
    })

    // 2. Background DB Sync
    if (!id.startsWith("temp-task")) {
      toggleTaskCompletion(id, true).catch(console.error)
    }
  }

  const deleteTask = (id: string) => {
    // 1. Optimistic UI Update
    setTasks((prev) => prev.filter((t) => t.id !== id))
    if (editingId === id) setEditingId(null)

    // 2. Background DB Sync
    if (!id.startsWith("temp-task")) {
      deleteTaskAction(id).catch(console.error)
    }
  }

  const startEdit = (task: Task) => {
    setEditingId(task.id)
    setEditDraft({
      title: task.title,
      priority: task.priority,
      repeat: task.repeat,
    })
  }

  const saveEdit = (id: string) => {
    if (editDraft.title.trim() === "") return

    // 1. Optimistic UI Update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              title: editDraft.title.trim(),
              priority: editDraft.priority,
              repeat: editDraft.repeat,
            }
          : t,
      ),
    )
    setEditingId(null)

    // 2. Background DB Sync
    if (!id.startsWith("temp-task")) {
      updateTaskDetails(id, editDraft.title.trim(), editDraft.priority, editDraft.repeat).catch(console.error)
    }
  }

  if (view === "history") {
    return (
      <TaskHistory
        initialHistory={history}
        onBack={() => setView("list")}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Stay on top of your day</p>
          <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
            Tasks
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {tasks.length} active · {history.length} completed
        </p>
      </header>

      {/* Navigation link to History */}
      <section aria-label="Task sections">
        <button
          type="button"
          onClick={() => setView("history")}
          className="glass group flex w-full items-center gap-4 rounded-3xl p-5 text-left transition-colors hover:bg-secondary/40"
        >
          <span className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-foreground">
            <History className="size-5" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold">History</p>
            <p className="text-xs text-muted-foreground">
              {history.length} completed · filter by date or month
            </p>
          </div>
          <ChevronRight
            className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </button>
      </section>

      {/* Priority summary */}
      <section aria-label="Priority summary">
        <div className="grid grid-cols-3 gap-4">
          {(["p1", "p2", "p3"] as Priority[]).map((p) => (
            <div key={p} className="glass flex flex-col gap-3 rounded-3xl p-5">
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                    priorityMeta[p].chip,
                  )}
                >
                  <Flag className="size-3.5" aria-hidden="true" />
                  {priorityMeta[p].label}
                </span>
                <span className={cn("size-2.5 rounded-full", priorityMeta[p].dot)} />
              </div>
              <p className="text-3xl font-semibold tracking-tight">{counts[p]}</p>
              <p className="text-xs text-muted-foreground">
                {counts[p] === 1 ? "task" : "tasks"}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Add tasks composer */}
      <section aria-label="Add tasks" className="glass flex flex-col gap-4 rounded-3xl p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-foreground">
            <Plus className="size-4" aria-hidden="true" />
          </span>
          <h2 className="text-sm font-semibold">Add tasks</h2>
        </div>

        <div className="flex flex-col gap-3">
          {drafts.map((draft) => (
            <div
              key={draft.id}
              className="flex flex-col gap-3 rounded-2xl bg-secondary/40 p-3 sm:flex-row sm:items-center"
            >
              <input
                type="text"
                value={draft.title}
                onChange={(e) => updateDraft(draft.id, { title: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addAllDrafts()
                }}
                placeholder="Task name…"
                className="flex-1 rounded-lg border border-border bg-background/40 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                aria-label="Task name"
              />
              <PrioritySelect
                value={draft.priority}
                onChange={(p) => updateDraft(draft.id, { priority: p })}
              />
              <RepeatSelect
                value={draft.repeat}
                onChange={(r) => updateDraft(draft.id, { repeat: r })}
              />
              <button
                type="button"
                onClick={() => removeDraftRow(draft.id)}
                disabled={drafts.length === 1}
                className="flex items-center justify-center rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Remove row"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={addDraftRow}
            className="flex w-fit items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add another row
          </button>
          <button
            type="button"
            onClick={addAllDrafts}
            className="flex w-fit items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add {drafts.filter((d) => d.title.trim() !== "").length || ""} task
            {drafts.filter((d) => d.title.trim() !== "").length === 1 ? "" : "s"}
          </button>
        </div>
      </section>

      {/* Task list */}
      <section aria-label="Task list" className="glass flex flex-col gap-4 rounded-3xl p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-foreground">
            <ListChecks className="size-4" aria-hidden="true" />
          </span>
          <h2 className="text-sm font-semibold">All tasks</h2>
        </div>

        {tasks.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No tasks yet. Add one above to get started.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {tasks.map((task) => {
              const isEditing = editingId === task.id
              return (
                <li
                  key={task.id}
                  className="flex flex-col gap-3 rounded-2xl bg-secondary/40 p-3 sm:flex-row sm:items-center"
                >
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={editDraft.title}
                        onChange={(e) =>
                          setEditDraft((d) => ({ ...d, title: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(task.id)
                          if (e.key === "Escape") setEditingId(null)
                        }}
                        className="flex-1 rounded-lg border border-border bg-background/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                        aria-label="Edit task name"
                        autoFocus
                      />
                      <PrioritySelect
                        value={editDraft.priority}
                        onChange={(p) =>
                          setEditDraft((d) => ({ ...d, priority: p }))
                        }
                      />
                      <RepeatSelect
                        value={editDraft.repeat}
                        onChange={(r) =>
                          setEditDraft((d) => ({ ...d, repeat: r }))
                        }
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => saveEdit(task.id)}
                          className="flex items-center justify-center rounded-lg bg-primary p-2 text-primary-foreground transition-opacity hover:opacity-90"
                          aria-label="Save"
                        >
                          <Check className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="flex items-center justify-center rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                          aria-label="Cancel"
                        >
                          <X className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => completeTask(task.id)}
                        className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border text-transparent transition-colors hover:border-primary hover:text-primary"
                        aria-label="Mark complete"
                      >
                        <Check className="size-4" aria-hidden="true" />
                      </button>

                      <div className="flex flex-1 flex-col gap-1">
                        <span className="text-sm font-medium">{task.title}</span>
                        {task.repeat !== "none" && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Repeat className="size-3" aria-hidden="true" />
                            {repeatLabels[task.repeat]}
                          </span>
                        )}
                      </div>

                      <span
                        className={cn(
                          "flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                          priorityMeta[task.priority].chip,
                        )}
                      >
                        <Flag className="size-3.5" aria-hidden="true" />
                        {priorityMeta[task.priority].label}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(task)}
                          className="flex items-center justify-center rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                          aria-label="Edit task"
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTask(task.id)}
                          className="flex items-center justify-center rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                          aria-label="Delete task"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}