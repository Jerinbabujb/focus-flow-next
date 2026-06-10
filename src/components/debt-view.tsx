"use client"

import { useMemo, useState } from "react"
import {
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  HandCoins,
  History,
  CalendarDays,
  Users,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  StickyNote,
} from "lucide-react"
import { cn } from "@/src/lib/utils"
import { DebtHistory, type DebtHistoryItem } from "@/src/components/debt-history"
import { DebtGroups } from "@/src/components/debt-groups"

type DebtCategory = "to-give" | "given"

interface DebtItem {
  id: string
  person: string
  note: string
  category: DebtCategory
  amount: number
  date: string
}

interface DraftRow {
  id: string
  person: string
  note: string
  category: DebtCategory
  amount: string
  date: string
}

const categoryMeta: Record<
  DebtCategory,
  { label: string; dot: string; chip: string; icon: typeof ArrowUpRight }
> = {
  "to-give": { label: "To give", dot: "bg-chart-5", chip: "bg-chart-5/15 text-chart-5", icon: ArrowUpRight },
  given: { label: "Given", dot: "bg-chart-2", chip: "bg-chart-2/15 text-chart-2", icon: ArrowDownLeft },
}

const today = () => new Date().toISOString().slice(0, 10)

const formatDate = (iso: string) =>
  iso
    ? new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : "—"

const formatMoney = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD" })

const initialItems: DebtItem[] = [
  { id: "d1", person: "Jordan", note: "Lunch last week", category: "to-give", amount: 18, date: today() },
  { id: "d2", person: "Sam", note: "Movie tickets", category: "to-give", amount: 32, date: today() },
  { id: "d3", person: "Casey", note: "Repaid loan", category: "given", amount: 50, date: today() },
]

const seededHistory: DebtHistoryItem[] = [
  { id: "dh1", person: "Alex", note: "Concert", category: "to-give", amount: 60, date: "2026-05-04", settledAt: "2026-05-04" },
  { id: "dh2", person: "Taylor", note: "Groceries", category: "given", amount: 25, date: "2026-05-04", settledAt: "2026-05-04" },
  { id: "dh3", person: "Morgan", note: "Cab fare", category: "to-give", amount: 14, date: "2026-04-20", settledAt: "2026-04-20" },
]

let idCounter = 0
const nextId = () => `debt-${Date.now()}-${idCounter++}`

const emptyDraft = (): DraftRow => ({
  id: nextId(),
  person: "",
  note: "",
  category: "to-give",
  amount: "",
  date: today(),
})

function CategorySelect({ value, onChange }: { value: DebtCategory; onChange: (c: DebtCategory) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as DebtCategory)}
      className="rounded-lg border border-border bg-secondary px-2.5 py-2 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-ring"
      aria-label="Category"
    >
      <option value="to-give">To give</option>
      <option value="given">Given</option>
    </select>
  )
}

type SubView = "list" | "history" | "groups"

export function DebtView() {
  const [view, setView] = useState<SubView>("list")
  const [items, setItems] = useState<DebtItem[]>(initialItems)
  const [history, setHistory] = useState<DebtHistoryItem[]>(seededHistory)
  const [drafts, setDrafts] = useState<DraftRow[]>([emptyDraft()])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<DraftRow>(emptyDraft())

  const counts = useMemo(
    () =>
      items.reduce(
        (acc, i) => {
          acc[i.category] += 1
          return acc
        },
        { "to-give": 0, given: 0 } as Record<DebtCategory, number>,
      ),
    [items],
  )

  const totals = useMemo(() => {
    const toGive = items.filter((i) => i.category === "to-give").reduce((s, i) => s + i.amount, 0)
    const given = items.filter((i) => i.category === "given").reduce((s, i) => s + i.amount, 0)
    return { toGive, given, net: toGive - given }
  }, [items])

  const grouped = useMemo(() => {
    const order: DebtCategory[] = ["to-give", "given"]
    return order
      .map((cat) => [cat, items.filter((i) => i.category === cat)] as const)
      .filter(([, arr]) => arr.length > 0)
  }, [items])

  // --- Draft handlers ---
  const updateDraft = (id: string, patch: Partial<DraftRow>) =>
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)))

  const addDraftRow = () => setDrafts((prev) => [...prev, emptyDraft()])

  const removeDraftRow = (id: string) =>
    setDrafts((prev) => (prev.length === 1 ? prev : prev.filter((d) => d.id !== id)))

  const parseDraft = (d: DraftRow): DebtItem => ({
    id: nextId(),
    person: d.person.trim(),
    note: d.note.trim(),
    category: d.category,
    amount: Math.max(0, Number.parseFloat(d.amount) || 0),
    date: d.date,
  })

  const addAllDrafts = () => {
    const valid = drafts.filter((d) => d.person.trim() !== "")
    if (valid.length === 0) return
    setItems((prev) => [...valid.map(parseDraft), ...prev])
    setDrafts([emptyDraft()])
  }

  // --- Item handlers ---
  const settleItem = (id: string) => {
    setItems((prev) => {
      const found = prev.find((i) => i.id === id)
      if (found) {
        setHistory((h) => [{ ...found, settledAt: today() }, ...h])
      }
      return prev.filter((i) => i.id !== id)
    })
  }

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
    if (editingId === id) setEditingId(null)
  }

  const startEdit = (item: DebtItem) => {
    setEditingId(item.id)
    setEditDraft({
      id: item.id,
      person: item.person,
      note: item.note,
      category: item.category,
      amount: String(item.amount),
      date: item.date,
    })
  }

  const saveEdit = (id: string) => {
    if (editDraft.person.trim() === "") return
    setItems((prev) => prev.map((i) => (i.id === id ? { ...parseDraft(editDraft), id } : i)))
    setEditingId(null)
  }

  if (view === "history") {
    return (
      <DebtHistory
        history={history}
        onBack={() => setView("list")}
        onClear={() => setHistory([])}
      />
    )
  }

  if (view === "groups") {
    return <DebtGroups onBack={() => setView("list")} />
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Track who owes what</p>
          <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
            Debts
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {items.length} open entr{items.length === 1 ? "y" : "ies"}
        </p>
      </header>

      {/* Navigation links to History & Groups */}
      <section aria-label="Debt sections" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setView("history")}
          className="glass group flex items-center gap-4 rounded-3xl p-5 text-left transition-colors hover:bg-secondary/40"
        >
          <span className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-foreground">
            <History className="size-5" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold">History</p>
            <p className="text-xs text-muted-foreground">
              {history.length} entr{history.length === 1 ? "y" : "ies"} · filter by date or month
            </p>
          </div>
          <ChevronRight
            className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          onClick={() => setView("groups")}
          className="glass group flex items-center gap-4 rounded-3xl p-5 text-left transition-colors hover:bg-secondary/40"
        >
          <span className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-foreground">
            <Users className="size-5" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold">Groups</p>
            <p className="text-xs text-muted-foreground">
              Create groups, invite people, track together
            </p>
          </div>
          <ChevronRight
            className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </button>
      </section>

      {/* Summary cards */}
      <section aria-label="Summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {(["to-give", "given"] as DebtCategory[]).map((c) => {
          const Icon = categoryMeta[c].icon
          const sum = c === "to-give" ? totals.toGive : totals.given
          return (
            <div key={c} className="glass flex flex-col gap-3 rounded-3xl p-5">
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                    categoryMeta[c].chip,
                  )}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  {categoryMeta[c].label}
                </span>
                <span className={cn("size-2.5 rounded-full", categoryMeta[c].dot)} />
              </div>
              <p className="text-3xl font-semibold tracking-tight">{formatMoney(sum)}</p>
              <p className="text-xs text-muted-foreground">
                {counts[c]} entr{counts[c] === 1 ? "y" : "ies"}
              </p>
            </div>
          )
        })}

        <div className="glass flex flex-col gap-3 rounded-3xl p-5">
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            Entries
          </span>
          <p className="text-3xl font-semibold tracking-tight">{items.length}</p>
          <p className="text-xs text-muted-foreground">open total</p>
        </div>

        <div className="glass flex flex-col gap-3 rounded-3xl p-5">
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
            Net
          </span>
          <p
            className={cn(
              "text-3xl font-semibold tracking-tight",
              totals.net < 0 && "text-chart-2",
            )}
          >
            {formatMoney(totals.net)}
          </p>
          <p className="text-xs text-muted-foreground">to give − given</p>
        </div>
      </section>

      {/* Add composer */}
      <section aria-label="Add debts" className="glass flex flex-col gap-4 rounded-3xl p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-foreground">
            <Plus className="size-4" aria-hidden="true" />
          </span>
          <h2 className="text-sm font-semibold">Add entries</h2>
        </div>

        <div className="flex flex-col gap-3">
          {drafts.map((draft) => (
            <div key={draft.id} className="flex flex-col gap-3 rounded-2xl bg-secondary/40 p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={draft.person}
                  onChange={(e) => updateDraft(draft.id, { person: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addAllDrafts()
                  }}
                  placeholder="Person…"
                  className="flex-1 rounded-lg border border-border bg-background/40 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                  aria-label="Person"
                />
                <CategorySelect
                  value={draft.category}
                  onChange={(c) => updateDraft(draft.id, { category: c })}
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

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  Amount
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={draft.amount}
                    onChange={(e) => updateDraft(draft.id, { amount: e.target.value })}
                    placeholder="0.00"
                    className="w-28 rounded-lg border border-border bg-background/40 px-2.5 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                    aria-label="Amount"
                  />
                </label>
                <label className="flex flex-1 items-center gap-2 text-xs text-muted-foreground">
                  <StickyNote className="size-3.5" aria-hidden="true" />
                  Note
                  <span className="text-[10px] uppercase tracking-wide opacity-70">(optional)</span>
                  <input
                    type="text"
                    value={draft.note}
                    onChange={(e) => updateDraft(draft.id, { note: e.target.value })}
                    placeholder="What was it for?"
                    className="flex-1 rounded-lg border border-border bg-background/40 px-2.5 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                    aria-label="Note"
                  />
                </label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="size-3.5" aria-hidden="true" />
                  Date
                  <input
                    type="date"
                    value={draft.date}
                    onChange={(e) => updateDraft(draft.id, { date: e.target.value })}
                    className="rounded-lg border border-border bg-background/40 px-2.5 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                    aria-label="Date"
                  />
                </label>
              </div>
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
            Add {drafts.filter((d) => d.person.trim() !== "").length || ""} entr
            {drafts.filter((d) => d.person.trim() !== "").length === 1 ? "y" : "ies"}
          </button>
        </div>
      </section>

      {/* Grouped list */}
      <section aria-label="Debt list" className="glass flex flex-col gap-5 rounded-3xl p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-foreground">
            <HandCoins className="size-4" aria-hidden="true" />
          </span>
          <h2 className="text-sm font-semibold">Open entries</h2>
        </div>

        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No open entries. Add one above to get started.
          </p>
        ) : (
          grouped.map(([category, categoryItems]) => {
            const CatIcon = categoryMeta[category].icon
            return (
              <div key={category} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <CatIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {categoryMeta[category].label}
                  </h3>
                  <span className="text-xs text-muted-foreground">({categoryItems.length})</span>
                </div>

                <ul className="flex flex-col gap-2">
                  {categoryItems.map((item) => {
                    const isEditing = editingId === item.id
                    return (
                      <li
                        key={item.id}
                        className="flex flex-col gap-3 rounded-2xl bg-secondary/40 p-3 sm:flex-row sm:items-center"
                      >
                        {isEditing ? (
                          <>
                            <input
                              type="text"
                              value={editDraft.person}
                              onChange={(e) => setEditDraft((d) => ({ ...d, person: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEdit(item.id)
                                if (e.key === "Escape") setEditingId(null)
                              }}
                              className="flex-1 rounded-lg border border-border bg-background/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                              aria-label="Edit person"
                              autoFocus
                            />
                            <CategorySelect
                              value={editDraft.category}
                              onChange={(c) => setEditDraft((d) => ({ ...d, category: c }))}
                            />
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={editDraft.amount}
                              onChange={(e) => setEditDraft((d) => ({ ...d, amount: e.target.value }))}
                              placeholder="0.00"
                              className="w-24 rounded-lg border border-border bg-background/40 px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                              aria-label="Edit amount"
                            />
                            <input
                              type="text"
                              value={editDraft.note}
                              onChange={(e) => setEditDraft((d) => ({ ...d, note: e.target.value }))}
                              placeholder="Note"
                              className="flex-1 rounded-lg border border-border bg-background/40 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                              aria-label="Edit note"
                            />
                            <input
                              type="date"
                              value={editDraft.date}
                              onChange={(e) => setEditDraft((d) => ({ ...d, date: e.target.value }))}
                              className="rounded-lg border border-border bg-background/40 px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                              aria-label="Edit date"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => saveEdit(item.id)}
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
                              onClick={() => settleItem(item.id)}
                              className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border text-transparent transition-colors hover:border-primary hover:text-primary"
                              aria-label="Mark as settled"
                              title="Mark as settled"
                            >
                              <Check className="size-4" aria-hidden="true" />
                            </button>

                            <div className="flex flex-1 flex-col gap-1">
                              <span className="text-sm font-medium">{item.person}</span>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                {item.note && <span>{item.note}</span>}
                                <span className="flex items-center gap-1">
                                  <CalendarDays className="size-3" aria-hidden="true" />
                                  {formatDate(item.date)}
                                </span>
                              </div>
                            </div>

                            <span
                              className={cn(
                                "flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                                categoryMeta[item.category].chip,
                              )}
                            >
                              {categoryMeta[item.category].label}
                            </span>

                            <span className="text-sm font-semibold tabular-nums">
                              {formatMoney(item.amount)}
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => startEdit(item)}
                                className="flex items-center justify-center rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                                aria-label="Edit entry"
                              >
                                <Pencil className="size-4" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteItem(item.id)}
                                className="flex items-center justify-center rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                                aria-label="Delete entry"
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
              </div>
            )
          })
        )}
      </section>
    </div>
  )
}
