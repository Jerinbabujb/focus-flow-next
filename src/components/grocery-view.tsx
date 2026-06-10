"use client"

import { useMemo, useState } from "react"
import {
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Flag,
  ShoppingCart,
  ShoppingBasket,
  History,
  CalendarDays,
  Tag,
  Users,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/src/lib/utils"
import { GroceryHistory, type HistoryItem } from "@/src/components/grocery-history"
import { GroceryGroups } from "@/src/components/grocery-groups"

type Priority = "p1" | "p2" | "p3"

const categories = ["Produce", "Dairy", "Bakery", "Meat", "Pantry", "Frozen", "Household", "Other"] as const
type Category = (typeof categories)[number]

interface GroceryItem {
  id: string
  name: string
  priority: Priority
  category: Category
  quantity: number
  amount: number | null
  buyDate: string
}

interface DraftRow {
  id: string
  name: string
  priority: Priority
  category: Category
  quantity: string
  amount: string
  buyDate: string
}

const priorityMeta: Record<Priority, { label: string; dot: string; chip: string }> = {
  p1: { label: "P1", dot: "bg-chart-5", chip: "bg-chart-5/15 text-chart-5" },
  p2: { label: "P2", dot: "bg-chart-4", chip: "bg-chart-4/15 text-chart-4" },
  p3: { label: "P3", dot: "bg-chart-2", chip: "bg-chart-2/15 text-chart-2" },
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

const initialItems: GroceryItem[] = [
  { id: "g1", name: "Bananas", priority: "p3", category: "Produce", quantity: 6, amount: 2.4, buyDate: today() },
  { id: "g2", name: "Whole milk", priority: "p1", category: "Dairy", quantity: 2, amount: 5.0, buyDate: today() },
  { id: "g3", name: "Sourdough loaf", priority: "p2", category: "Bakery", quantity: 1, amount: 4.5, buyDate: today() },
  { id: "g4", name: "Chicken breast", priority: "p1", category: "Meat", quantity: 3, amount: null, buyDate: today() },
]

const seededHistory: HistoryItem[] = [
  { id: "h1", name: "Eggs", priority: "p1", category: "Dairy", quantity: 1, amount: 4.0, buyDate: "2026-05-02", boughtAt: "2026-05-02" },
  { id: "h2", name: "Tomatoes", priority: "p2", category: "Produce", quantity: 5, amount: 3.25, buyDate: "2026-05-02", boughtAt: "2026-05-02" },
  { id: "h3", name: "Coffee beans", priority: "p1", category: "Pantry", quantity: 1, amount: 12.5, buyDate: "2026-04-18", boughtAt: "2026-04-18" },
]

let idCounter = 0
const nextId = () => `gro-${Date.now()}-${idCounter++}`

const emptyDraft = (): DraftRow => ({
  id: nextId(),
  name: "",
  priority: "p2",
  category: "Produce",
  quantity: "1",
  amount: "",
  buyDate: today(),
})

function PrioritySelect({ value, onChange }: { value: Priority; onChange: (p: Priority) => void }) {
  return (
    <select
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

function CategorySelect({ value, onChange }: { value: Category; onChange: (c: Category) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Category)}
      className="rounded-lg border border-border bg-secondary px-2.5 py-2 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-ring"
      aria-label="Category"
    >
      {categories.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  )
}

type SubView = "list" | "history" | "groups"

export function GroceryView() {
  const [view, setView] = useState<SubView>("list")
  const [items, setItems] = useState<GroceryItem[]>(initialItems)
  const [history, setHistory] = useState<HistoryItem[]>(seededHistory)
  const [drafts, setDrafts] = useState<DraftRow[]>([emptyDraft()])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<DraftRow>(emptyDraft())

  const counts = useMemo(
    () =>
      items.reduce(
        (acc, i) => {
          acc[i.priority] += 1
          return acc
        },
        { p1: 0, p2: 0, p3: 0 } as Record<Priority, number>,
      ),
    [items],
  )

  const totals = useMemo(() => {
    const totalQty = items.reduce((s, i) => s + i.quantity, 0)
    const totalAmount = items.reduce((s, i) => s + (i.amount ?? 0), 0)
    return { totalQty, totalAmount }
  }, [items])

  const grouped = useMemo(() => {
    const map = new Map<Category, GroceryItem[]>()
    for (const item of items) {
      const arr = map.get(item.category) ?? []
      arr.push(item)
      map.set(item.category, arr)
    }
    return Array.from(map.entries())
  }, [items])

  // --- Draft handlers ---
  const updateDraft = (id: string, patch: Partial<DraftRow>) =>
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)))

  const addDraftRow = () => setDrafts((prev) => [...prev, emptyDraft()])

  const removeDraftRow = (id: string) =>
    setDrafts((prev) => (prev.length === 1 ? prev : prev.filter((d) => d.id !== id)))

  const parseDraft = (d: DraftRow): GroceryItem => ({
    id: nextId(),
    name: d.name.trim(),
    priority: d.priority,
    category: d.category,
    quantity: Math.max(1, Number.parseInt(d.quantity, 10) || 1),
    amount: d.amount.trim() === "" ? null : Math.max(0, Number.parseFloat(d.amount) || 0),
    buyDate: d.buyDate,
  })

  const addAllDrafts = () => {
    const valid = drafts.filter((d) => d.name.trim() !== "")
    if (valid.length === 0) return
    setItems((prev) => [...valid.map(parseDraft), ...prev])
    setDrafts([emptyDraft()])
  }

  // --- Item handlers ---
  const markBought = (id: string) => {
    setItems((prev) => {
      const found = prev.find((i) => i.id === id)
      if (found) {
        setHistory((h) => [{ ...found, boughtAt: today() }, ...h])
      }
      return prev.filter((i) => i.id !== id)
    })
  }

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
    if (editingId === id) setEditingId(null)
  }

  const startEdit = (item: GroceryItem) => {
    setEditingId(item.id)
    setEditDraft({
      id: item.id,
      name: item.name,
      priority: item.priority,
      category: item.category,
      quantity: String(item.quantity),
      amount: item.amount == null ? "" : String(item.amount),
      buyDate: item.buyDate,
    })
  }

  const saveEdit = (id: string) => {
    if (editDraft.name.trim() === "") return
    setItems((prev) => prev.map((i) => (i.id === id ? { ...parseDraft(editDraft), id } : i)))
    setEditingId(null)
  }

  if (view === "history") {
    return (
      <GroceryHistory
        history={history}
        onBack={() => setView("list")}
        onClear={() => setHistory([])}
      />
    )
  }

  if (view === "groups") {
    return <GroceryGroups onBack={() => setView("list")} />
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Plan your shopping run</p>
          <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
            Groceries
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {items.length} item{items.length === 1 ? "" : "s"} on the list
        </p>
      </header>

      {/* Navigation links to History & Groups */}
      <section aria-label="Grocery sections" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              {history.length} purchase{history.length === 1 ? "" : "s"} · filter by date or month
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
              Create groups, invite people, shop together
            </p>
          </div>
          <ChevronRight
            className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </button>
      </section>

      {/* Summary cards */}
      <section aria-label="Summary" className="grid grid-cols-2 gap-4 lg:grid-cols-5">
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
            <p className="text-xs text-muted-foreground">{counts[p] === 1 ? "item" : "items"}</p>
          </div>
        ))}

        <div className="glass flex flex-col gap-3 rounded-3xl p-5">
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            <ShoppingBasket className="size-3.5" aria-hidden="true" />
            Qty
          </span>
          <p className="text-3xl font-semibold tracking-tight">{totals.totalQty}</p>
          <p className="text-xs text-muted-foreground">total units</p>
        </div>

        <div className="glass flex flex-col gap-3 rounded-3xl p-5">
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
            Total
          </span>
          <p className="text-3xl font-semibold tracking-tight">{formatMoney(totals.totalAmount)}</p>
          <p className="text-xs text-muted-foreground">estimated cost</p>
        </div>
      </section>

      {/* Add composer */}
      <section aria-label="Add groceries" className="glass flex flex-col gap-4 rounded-3xl p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-foreground">
            <Plus className="size-4" aria-hidden="true" />
          </span>
          <h2 className="text-sm font-semibold">Add groceries</h2>
        </div>

        <div className="flex flex-col gap-3">
          {drafts.map((draft) => (
            <div key={draft.id} className="flex flex-col gap-3 rounded-2xl bg-secondary/40 p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) => updateDraft(draft.id, { name: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addAllDrafts()
                  }}
                  placeholder="Item name…"
                  className="flex-1 rounded-lg border border-border bg-background/40 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                  aria-label="Item name"
                />
                <PrioritySelect
                  value={draft.priority}
                  onChange={(p) => updateDraft(draft.id, { priority: p })}
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
                  <ShoppingBasket className="size-3.5" aria-hidden="true" />
                  Qty
                  <input
                    type="number"
                    min={1}
                    value={draft.quantity}
                    onChange={(e) => updateDraft(draft.id, { quantity: e.target.value })}
                    className="w-20 rounded-lg border border-border bg-background/40 px-2.5 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                    aria-label="Quantity"
                  />
                </label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  Amount
                  <span className="text-[10px] uppercase tracking-wide opacity-70">(optional)</span>
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
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="size-3.5" aria-hidden="true" />
                  Buy date
                  <input
                    type="date"
                    value={draft.buyDate}
                    onChange={(e) => updateDraft(draft.id, { buyDate: e.target.value })}
                    className="rounded-lg border border-border bg-background/40 px-2.5 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                    aria-label="Buy date"
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
            Add {drafts.filter((d) => d.name.trim() !== "").length || ""} item
            {drafts.filter((d) => d.name.trim() !== "").length === 1 ? "" : "s"}
          </button>
        </div>
      </section>

      {/* Grouped list */}
      <section aria-label="Grocery list" className="glass flex flex-col gap-5 rounded-3xl p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-foreground">
            <ShoppingCart className="size-4" aria-hidden="true" />
          </span>
          <h2 className="text-sm font-semibold">Shopping list</h2>
        </div>

        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Your list is empty. Add an item above to get started.
          </p>
        ) : (
          grouped.map(([category, categoryItems]) => (
            <div key={category} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Tag className="size-3.5 text-muted-foreground" aria-hidden="true" />
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {category}
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
                            value={editDraft.name}
                            onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit(item.id)
                              if (e.key === "Escape") setEditingId(null)
                            }}
                            className="flex-1 rounded-lg border border-border bg-background/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                            aria-label="Edit item name"
                            autoFocus
                          />
                          <PrioritySelect
                            value={editDraft.priority}
                            onChange={(p) => setEditDraft((d) => ({ ...d, priority: p }))}
                          />
                          <CategorySelect
                            value={editDraft.category}
                            onChange={(c) => setEditDraft((d) => ({ ...d, category: c }))}
                          />
                          <input
                            type="number"
                            min={1}
                            value={editDraft.quantity}
                            onChange={(e) => setEditDraft((d) => ({ ...d, quantity: e.target.value }))}
                            className="w-16 rounded-lg border border-border bg-background/40 px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                            aria-label="Edit quantity"
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
                            type="date"
                            value={editDraft.buyDate}
                            onChange={(e) => setEditDraft((d) => ({ ...d, buyDate: e.target.value }))}
                            className="rounded-lg border border-border bg-background/40 px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                            aria-label="Edit buy date"
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
                            onClick={() => markBought(item.id)}
                            className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border text-transparent transition-colors hover:border-primary hover:text-primary"
                            aria-label="Mark as bought"
                            title="Mark as bought"
                          >
                            <Check className="size-4" aria-hidden="true" />
                          </button>

                          <div className="flex flex-1 flex-col gap-1">
                            <span className="text-sm font-medium">{item.name}</span>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <ShoppingBasket className="size-3" aria-hidden="true" />
                                {item.quantity}
                              </span>
                              {item.amount != null && <span>{formatMoney(item.amount)}</span>}
                              <span className="flex items-center gap-1">
                                <CalendarDays className="size-3" aria-hidden="true" />
                                {formatDate(item.buyDate)}
                              </span>
                            </div>
                          </div>

                          <span
                            className={cn(
                              "flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                              priorityMeta[item.priority].chip,
                            )}
                          >
                            <Flag className="size-3.5" aria-hidden="true" />
                            {priorityMeta[item.priority].label}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              className="flex items-center justify-center rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                              aria-label="Edit item"
                            >
                              <Pencil className="size-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteItem(item.id)}
                              className="flex items-center justify-center rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                              aria-label="Delete item"
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
          ))
        )}
      </section>
    </div>
  )
}
