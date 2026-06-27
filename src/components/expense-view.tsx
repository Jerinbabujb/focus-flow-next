"use client"

import { useMemo, useState } from "react"
import {
  Wallet, TrendingDown, PiggyBank, Plus, Trash2, X, Sparkles,
  ShoppingCart, HandCoins, Archive, Pencil, Layers, BarChart3,
  ArrowUpRight, ArrowDownRight, Check, Target, Calendar, Clock
} from "lucide-react"
import { cn } from "@/src/lib/utils"
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { updateIncomeAction, addExpenseAction, deleteExpenseAction } from "@/src/actions/expenses"

type Source = "manual" | "groceries" | "debts" | "bills" | "combined"

export interface Expense {
  id: string
  name: string
  amount: number
  category: string
  source: Source
  date: string
  status: "completed" | "pending"
}

interface Goal { id: string; name: string; amount: number; targetDate: string }

const sourceMeta: Record<Source, { label: string; icon: typeof Wallet; tint: string }> = {
  manual: { label: "Manual", icon: Pencil, tint: "bg-chart-1/15 text-chart-1" },
  groceries: { label: "Groceries", icon: ShoppingCart, tint: "bg-chart-2/15 text-chart-2" },
  debts: { label: "Debts", icon: HandCoins, tint: "bg-chart-4/15 text-chart-4" },
  bills: { label: "Bills", icon: Archive, tint: "bg-chart-5/15 text-chart-5" },
  combined: { label: "Combined", icon: Layers, tint: "bg-chart-3/15 text-chart-3" },
}

const today = () => new Date().toISOString().slice(0, 10)
const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" })

let idCounter = 0
const nextId = () => `temp-exp-${Date.now()}-${idCounter++}`

interface ExpenseViewProps {
  initialIncome?: number
  initialExpenses?: any[]
  initialBills?: any[]
  pendingGroceries?: any[]
  completedGroceries?: any[]
  pendingDebts?: any[]
  completedDebts?: any[]
  groceryGroups?: any[]
  debtGroups?: any[]
}

export function ExpenseView({ 
  initialIncome = 0, initialExpenses = [], initialBills = [],
  pendingGroceries = [], completedGroceries = [],
  pendingDebts = [], completedDebts = [],
  groceryGroups = [], debtGroups = []
}: ExpenseViewProps) {
  const [income, setIncome] = useState(initialIncome)
  const [incomeDraft, setIncomeDraft] = useState("")
  const [editingIncome, setEditingIncome] = useState(false)

  const [expenses, setExpenses] = useState<any[]>(initialExpenses)

  const [showAdd, setShowAdd] = useState(false)
  const [showCombine, setShowCombine] = useState(false)
  const [showAi, setShowAi] = useState(false)

  const [form, setForm] = useState({ name: "", amount: "", category: "Food", source: "manual" as Source })
  const [combineName, setCombineName] = useState("")
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  
  const [goalForm, setGoalForm] = useState({ name: "", amount: "", targetDate: "" })
  const [goals, setGoals] = useState<Goal[]>([
    { id: "g1", name: "Relocation", amount: 2500, targetDate: "2026-07-25" },
  ])

  // Process Groups (Removed the .filter(>0) so they ALL show up)
  const mappedGroceryGroups = groceryGroups.map(g => ({
    id: g.id, name: g.name, total: g.items?.reduce((sum: number, i: any) => sum + (i.amount || 0), 0) || 0
  }))
  const mappedDebtGroups = debtGroups.map(g => ({
    id: g.id, name: g.name, total: g.entries?.reduce((sum: number, i: any) => sum + (i.amount || 0), 0) || 0
  }))

  const allGroups = [...mappedGroceryGroups, ...mappedDebtGroups]
  const combinedTotal = allGroups.filter((g) => selectedGroups.includes(g.id)).reduce((sum, g) => sum + g.total, 0)
  
  // Dynamic button label for Groups Modal
  const isSingleGroup = selectedGroups.length === 1
  const singleGroupName = isSingleGroup ? allGroups.find(g => g.id === selectedGroups[0])?.name : ""

  // Aggregate EVERYTHING into one giant pipeline
  const aggregatedExpenses = useMemo<Expense[]>(() => {
    const arr: Expense[] = []
    
    // 1. Manual DB Expenses
    expenses.forEach(e => arr.push({ ...e, status: "completed" }))
    // 2. Uploaded Bills
    initialBills.forEach(b => arr.push({ id: b.id, name: b.vendorName, amount: b.amount, category: "Bills", source: "bills", date: b.date, status: "completed" }))
    // 3. Completed Groceries
    completedGroceries.forEach(g => arr.push({ id: g.id, name: g.name, amount: g.amount || 0, category: "Food", source: "groceries", date: g.boughtAt, status: "completed" }))
    // 4. Pending Groceries (Future)
    pendingGroceries.forEach(g => arr.push({ id: g.id, name: g.name, amount: g.amount || 0, category: "Food", source: "groceries", date: g.buyDate, status: "pending" }))
    // 5. Completed Debts (Only things you owed others)
    completedDebts.filter(d => d.category === "to-give").forEach(d => arr.push({ id: d.id, name: `Paid: ${d.person}`, amount: d.amount, category: "Debt", source: "debts", date: d.settledAt, status: "completed" }))
    // 6. Pending Debts (Future - you still owe)
    pendingDebts.filter(d => d.category === "to-give").forEach(d => arr.push({ id: d.id, name: `Owe: ${d.person}`, amount: d.amount, category: "Debt", source: "debts", date: d.date, status: "pending" }))

    return arr.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [expenses, initialBills, completedGroceries, pendingGroceries, completedDebts, pendingDebts])

  const completedItems = aggregatedExpenses.filter(e => e.status === "completed")
  const futureItems = aggregatedExpenses.filter(e => e.status === "pending")

  // Math based on COMPLETED items
  const totalCompletedExpenses = completedItems.reduce((sum, e) => sum + e.amount, 0)
  const totalFutureExpenses = futureItems.reduce((sum, e) => sum + e.amount, 0)
  const remaining = income - totalCompletedExpenses
  const savingsRate = income > 0 ? Math.round((remaining / income) * 100) : 0

  const bySource = useMemo(() => {
    const map = new Map<Source, number>()
    for (const e of completedItems) map.set(e.source, (map.get(e.source) ?? 0) + e.amount)
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [completedItems])

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of completedItems) map.set(e.category, (map.get(e.category) ?? 0) + e.amount)
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [completedItems])
  
  const chartData = byCategory.map(([name, value]) => ({ name, value }))

  // Actions
  const saveIncome = () => {
    const val = Number.parseFloat(incomeDraft)
    if (!Number.isNaN(val) && val >= 0) { setIncome(val); updateIncomeAction(val).catch(console.error) }
    setEditingIncome(false)
  }

  const addExpense = () => {
    const amount = Number.parseFloat(form.amount)
    if (!form.name.trim() || Number.isNaN(amount) || amount <= 0) return
    setExpenses(prev => [{ id: nextId(), name: form.name.trim(), amount, category: form.category, source: form.source, date: today() }, ...prev])
    addExpenseAction(form.name.trim(), amount, form.category, form.source).catch(console.error)
    setForm({ name: "", amount: "", category: "Food", source: "manual" }); setShowAdd(false)
  }

  const handleGroupAdd = () => {
    if (selectedGroups.length === 0) return
    const finalName = isSingleGroup ? (singleGroupName || "Group Expense") : combineName.trim()
    if (!finalName) return

    setExpenses(prev => [{ id: nextId(), name: finalName, amount: combinedTotal, category: "Shared", source: isSingleGroup ? "manual" : "combined", date: today() }, ...prev])
    addExpenseAction(finalName, combinedTotal, "Shared", isSingleGroup ? "manual" : "combined").catch(console.error)
    
    setCombineName(""); setSelectedGroups([]); setShowCombine(false)
  }

  const removeExpense = (id: string, source: string) => {
    if (source !== "manual" && source !== "combined") return; // Prevent deleting auto-fetched items here
    setExpenses((prev) => prev.filter((e) => e.id !== id))
    if (!id.startsWith("temp")) deleteExpenseAction(id).catch(console.error)
  }

  const toggleGroup = (id: string) => setSelectedGroups((prev) => prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id])

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Plan, track, and optimize</p>
          <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">Expenses</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setShowAi(true)} className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary/70">
            <Sparkles className="size-4" /> AI Planner
          </button>
          <button type="button" onClick={() => setShowCombine(true)} className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary/70">
            <Layers className="size-4" /> Add from Groups
          </button>
          <button type="button" onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
            <Plus className="size-4" /> Add Expense
          </button>
        </div>
      </header>

      {/* SUMMARY CARDS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="glass flex flex-col gap-4 rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><Wallet className="size-5" /></span>
            {!editingIncome && (
              <button type="button" onClick={() => { setIncomeDraft(String(income)); setEditingIncome(true) }} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary">
                <Pencil className="size-3.5" /> Edit
              </button>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Income</p>
            {editingIncome ? (
              <div className="flex items-center gap-2">
                <input type="number" value={incomeDraft} onChange={(e) => setIncomeDraft(e.target.value)} className="w-full rounded-lg bg-secondary px-3 py-1.5 text-lg font-semibold outline-none ring-primary focus:ring-2" autoFocus />
                <button type="button" onClick={saveIncome} className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Check className="size-4" /></button>
              </div>
            ) : (<p className="text-3xl font-semibold tracking-tight">{money(income)}</p>)}
          </div>
        </div>

        <div className="glass flex flex-col gap-4 rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-destructive/15 text-destructive"><TrendingDown className="size-5" /></span>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Spent So Far</p>
            <p className="text-3xl font-semibold tracking-tight">{money(totalCompletedExpenses)}</p>
            <p className="text-xs text-muted-foreground">Across {completedItems.length} transactions</p>
          </div>
        </div>

        <div className="glass flex flex-col gap-4 rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-chart-3/15 text-chart-3"><PiggyBank className="size-5" /></span>
            <span className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", remaining >= 0 ? "bg-chart-3/15 text-chart-3" : "bg-destructive/15 text-destructive")}>
              {remaining >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />} {savingsRate}%
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Remaining Cash</p>
            <p className={cn("text-3xl font-semibold tracking-tight", remaining < 0 && "text-destructive")}>{money(remaining)}</p>
          </div>
        </div>
      </section>

      {/* CHARTS */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="glass flex flex-col gap-4 rounded-3xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-foreground"><BarChart3 className="size-4" /></span>
            <h2 className="text-sm font-semibold">Spending by Category</h2>
          </div>
          {chartData.length > 0 ? (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: 'currentColor', opacity: 0.6 }} />
                  <Tooltip cursor={{fill: 'var(--secondary)'}} contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }} formatter={(value: number) => money(value)} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill="hsl(var(--primary))" opacity={0.8} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (<div className="flex h-48 items-center justify-center text-sm text-muted-foreground">No data to display</div>)}
        </div>

        <div className="glass flex flex-col gap-4 rounded-3xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-foreground"><Layers className="size-4" /></span>
            <h2 className="text-sm font-semibold">Spending by Source</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 overflow-y-auto max-h-48 pr-2">
            {bySource.map(([source, amt]) => {
              const meta = sourceMeta[source]
              const Icon = meta.icon
              return (
                <div key={source} className="flex items-center gap-3 rounded-2xl bg-secondary/50 p-3 h-fit">
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", meta.tint)}><Icon className="size-4" /></span>
                  <div className="min-w-0"><p className="truncate text-sm font-medium">{meta.label}</p><p className="text-xs text-muted-foreground">{money(amt)}</p></div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* COMPLETED LIST */}
      <section className="glass flex flex-col gap-4 rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Completed Expenses</h2>
          <span className="text-xs text-muted-foreground">{completedItems.length} entries</span>
        </div>
        <ExpenseList items={completedItems} onRemove={removeExpense} />
      </section>

      {/* FUTURE LIST */}
      {futureItems.length > 0 && (
        <section className="glass flex flex-col gap-4 rounded-3xl p-5 border-dashed border-primary/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-primary">Upcoming Liabilities</h2>
            </div>
            <span className="text-xs font-bold text-destructive">{money(totalFutureExpenses)}</span>
          </div>
          <ExpenseList items={futureItems} onRemove={removeExpense} />
        </section>
      )}

      {/* GROUPS MODAL */}
      {showCombine && (
        <Modal title="Add from Groups" subtitle="Add single or combined groups to your expenses" onClose={() => setShowCombine(false)}>
          <div className="mt-5 flex flex-col gap-4">
            {!isSingleGroup && selectedGroups.length > 0 && (
              <Field label="Combined Expense Name">
                <input value={combineName} onChange={(e) => setCombineName(e.target.value)} placeholder="e.g. Weekend trip" className="w-full rounded-xl bg-secondary px-3 py-2.5 text-sm outline-none ring-primary focus:ring-2" autoFocus />
              </Field>
            )}
            
            {mappedGroceryGroups.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Grocery groups</p>
                <div className="flex flex-col gap-2">{mappedGroceryGroups.map((g) => <GroupRow key={g.id} name={g.name} total={g.total} icon={ShoppingCart} selected={selectedGroups.includes(g.id)} onToggle={() => toggleGroup(g.id)} />)}</div>
              </div>
            )}
            {mappedDebtGroups.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Debt groups</p>
                <div className="flex flex-col gap-2">{mappedDebtGroups.map((g) => <GroupRow key={g.id} name={g.name} total={g.total} icon={HandCoins} selected={selectedGroups.includes(g.id)} onToggle={() => toggleGroup(g.id)} />)}</div>
              </div>
            )}
            <div className="flex items-center justify-between rounded-xl bg-secondary/60 px-4 py-3">
              <span className="text-sm font-medium">Total to add</span>
              <span className="text-lg font-semibold">{money(combinedTotal)}</span>
            </div>
            <button type="button" onClick={handleGroupAdd} disabled={selectedGroups.length === 0 || (!isSingleGroup && !combineName.trim())} className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40">
              {isSingleGroup ? `Add ${singleGroupName} as Expense` : "Add Combined Expense"}
            </button>
          </div>
        </Modal>
      )}
      
      {/* (KEEP YOUR EXISTING MODALS HERE FOR ADD EXPENSE & AI) */}
      
    </div>
  )
}

function ExpenseList({ items, onRemove }: { items: Expense[], onRemove: (id: string, source: string) => void }) {
  if (items.length === 0) return <div className="rounded-2xl bg-secondary/40 p-6 text-center text-sm text-muted-foreground">No entries found.</div>
  
  return (
    <ul className="flex flex-col gap-2">
      {items.map((e) => {
        const meta = sourceMeta[e.source]
        const Icon = meta.icon
        // Only allow manual deletion of "manual" or "combined" expenses. Others auto-sync from their respective pages.
        const canDelete = e.source === "manual" || e.source === "combined"
        
        return (
          <li key={e.id} className="flex items-center gap-3 rounded-2xl bg-secondary/40 p-3">
            <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", meta.tint)}><Icon className="size-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{e.name}</p>
              <p className="text-xs text-muted-foreground">{e.category} · {meta.label} · {e.date}</p>
            </div>
            <span className="text-sm font-semibold tabular-nums">{money(e.amount)}</span>
            {canDelete && (
              <button type="button" onClick={() => onRemove(e.id, e.source)} className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive">
                <Trash2 className="size-4" />
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}

// ... Keep Modal, Field, and GroupRow components
function Modal({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      <div className="glass relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div><h2 className="text-lg font-semibold tracking-tight">{title}</h2><p className="text-sm text-muted-foreground">{subtitle}</p></div>
          <button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"><X className="size-4" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-1.5"><span className="text-xs font-medium text-muted-foreground">{label}</span>{children}</label>
}
function GroupRow({ name, total, icon: Icon, selected, onToggle }: { name: string; total: number; icon: typeof Wallet; selected: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} aria-pressed={selected} className={cn("flex items-center gap-3 rounded-xl border p-3 text-left transition-colors", selected ? "border-primary bg-accent/40" : "border-border hover:bg-secondary")}>
      <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-foreground"><Icon className="size-4" /></span>
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{name}</p><p className="text-xs text-muted-foreground">{money(total)}</p></div>
      <span className={cn("flex size-5 items-center justify-center rounded-md border", selected ? "border-primary bg-primary text-primary-foreground" : "border-border text-transparent")}><Check className="size-3.5" /></span>
    </button>
  )
}