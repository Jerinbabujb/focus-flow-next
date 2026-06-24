"use client"

import { useMemo, useState } from "react"
import {
  Users, ArrowLeft, Plus, UserPlus, X, Trash2, Check, Mail, HandCoins, ArrowUpRight, ArrowDownLeft,
} from "lucide-react"
import { cn } from "@/src/lib/utils"

// 1. Import universal group actions
import { createGroupAction, deleteGroupAction, inviteMemberAction, removeMemberAction } from "@/src/actions/grocery-group"
// 2. Import debt-specific actions
import { toggleDebtSettled, deleteDebt, addSharedDebt } from "@/src/actions/debts"

export type DebtCategory = "to-give" | "given"

export interface Member {
  id: string
  name: string
  email: string
  status: "owner" | "joined" | "invited"
}

export interface GroupEntry {
  id: string
  person: string
  note: string
  category: DebtCategory
  amount: number
  addedBy: string
  settled: boolean
}

export interface DebtGroup {
  id: string
  name: string
  members: Member[]
  entries: GroupEntry[]
}

const formatMoney = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD" })

const categoryMeta: Record<DebtCategory, { label: string; chip: string; icon: typeof ArrowUpRight }> = {
  "to-give": { label: "To give", chip: "bg-chart-5/15 text-chart-5", icon: ArrowUpRight },
  given: { label: "Given", chip: "bg-chart-2/15 text-chart-2", icon: ArrowDownLeft },
}

let idc = 0
// Using "temp-" to protect the DB from optimistic UI crashes
const nid = (p: string) => `temp-${p}-${Date.now()}-${idc++}`

const avatarColor = (name: string) => {
  const colors = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"]
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return colors[Math.abs(h) % colors.length]
}

interface DebtGroupsProps {
  initialGroups?: DebtGroup[] // Accept live DB data
  onBack: () => void
}

export function DebtGroups({ initialGroups = [], onBack }: DebtGroupsProps) {
  const [groups, setGroups] = useState<DebtGroup[]>(initialGroups)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [newGroupName, setNewGroupName] = useState("")

  const [inviteName, setInviteName] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")

  const [person, setPerson] = useState("")
  const [note, setNote] = useState("")
  const [category, setCategory] = useState<DebtCategory>("to-give")
  const [amount, setAmount] = useState("")

  const active = useMemo(() => groups.find((g) => g.id === activeId) ?? null, [groups, activeId])

  const createGroup = () => {
    if (newGroupName.trim() === "") return
    const g: DebtGroup = {
      id: nid("dgrp"),
      name: newGroupName.trim(),
      members: [{ id: nid("m"), name: "You", email: "", status: "owner" }],
      entries: [],
    }
    
    // 1. Optimistic UI
    setGroups((prev) => [g, ...prev])
    // 2. DB Sync
createGroupAction(newGroupName.trim(), "DEBT").catch(console.error)
    
    setNewGroupName("")
    setActiveId(g.id)
  }

  const deleteGroup = (id: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== id))
    if (activeId === id) setActiveId(null)
    if (!id.startsWith("temp")) deleteGroupAction(id).catch(console.error)
  }

  const inviteMember = () => {
    if (!active || inviteEmail.trim() === "") return
    const member: Member = {
      id: nid("m"),
      name: inviteName.trim() || inviteEmail.trim().split("@")[0],
      email: inviteEmail.trim(),
      status: "invited",
    }
    setGroups((prev) => prev.map((g) => (g.id === active.id ? { ...g, members: [...g.members, member] } : g)))
    
    if (!active.id.startsWith("temp")) {
      inviteMemberAction(active.id, inviteEmail.trim(), inviteName.trim()).catch(console.error)
    }
    
    setInviteName("")
    setInviteEmail("")
  }

  const removeMember = (memberId: string) => {
    if (!active) return
    setGroups((prev) => prev.map((g) => g.id === active.id ? { ...g, members: g.members.filter((m) => m.id !== memberId) } : g))
    if (!memberId.startsWith("temp")) removeMemberAction(memberId).catch(console.error)
  }

  const addEntry = () => {
    if (!active || person.trim() === "") return
    
    const parsedAmount = Math.max(0, Number.parseFloat(amount) || 0)
    const entry: GroupEntry = {
      id: nid("de"),
      person: person.trim(),
      note: note.trim(),
      category,
      amount: parsedAmount,
      addedBy: "You",
      settled: false,
    }
    
    setGroups((prev) => prev.map((g) => (g.id === active.id ? { ...g, entries: [entry, ...g.entries] } : g)))
    
    // DB Sync
    if (!active.id.startsWith("temp")) {
      addSharedDebt(active.id, person.trim(), note.trim(), category, parsedAmount, new Date().toISOString()).catch(console.error)
    }
    
    setPerson("")
    setNote("")
    setCategory("to-give")
    setAmount("")
  }

  const toggleEntry = (entryId: string) => {
    if (!active) return
    const entry = active.entries.find(e => e.id === entryId)
    if (!entry) return

    setGroups((prev) => prev.map((g) => g.id === active.id ? { ...g, entries: g.entries.map((e) => (e.id === entryId ? { ...e, settled: !e.settled } : e)) } : g))
    
    if (!entryId.startsWith("temp")) toggleDebtSettled(entryId, !entry.settled).catch(console.error)
  }

  const deleteEntry = (entryId: string) => {
    if (!active) return
    setGroups((prev) => prev.map((g) => g.id === active.id ? { ...g, entries: g.entries.filter((e) => e.id !== entryId) } : g))
    
    if (!entryId.startsWith("temp")) deleteDebt(entryId).catch(console.error)
  }

  // ---------- Group detail view ----------
  if (active) {
    const toGive = active.entries.filter((e) => e.category === "to-give").reduce((s, e) => s + e.amount, 0)
    const given = active.entries.filter((e) => e.category === "given").reduce((s, e) => s + e.amount, 0)
    const net = toGive - given
    return (
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <button type="button" onClick={() => setActiveId(null)} className="flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden="true" /> All groups
          </button>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Shared debt group</p>
              <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">{active.name}</h1>
            </div>
            <div className="flex -space-x-2">
              {active.members.map((m) => (
                <span key={m.id} title={m.name} className={cn("flex size-9 items-center justify-center rounded-full border-2 border-card text-xs font-semibold text-primary-foreground", avatarColor(m.name))}>
                  {m.name.slice(0, 1).toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        </header>

        {/* Members */}
        <section aria-label="Members" className="glass flex flex-col gap-4 rounded-3xl p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-foreground"><Users className="size-4" aria-hidden="true" /></span>
            <h2 className="text-sm font-semibold">Members</h2>
            <span className="text-xs text-muted-foreground">({active.members.length})</span>
          </div>

          <ul className="flex flex-col gap-2">
            {active.members.map((m) => (
              <li key={m.id} className="flex items-center gap-3 rounded-2xl bg-secondary/40 p-3">
                <span className={cn("flex size-9 items-center justify-center rounded-full text-xs font-semibold text-primary-foreground", avatarColor(m.name))}>{m.name.slice(0, 1).toUpperCase()}</span>
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-medium">{m.name}</span>
                  <span className="text-xs text-muted-foreground">{m.email}</span>
                </div>
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold capitalize", m.status === "owner" && "bg-primary/15 text-primary", m.status === "joined" && "bg-chart-2/15 text-chart-2", m.status === "invited" && "bg-chart-4/15 text-chart-4")}>{m.status}</span>
                {m.status !== "owner" && (
                  <button type="button" onClick={() => removeMember(m.id)} className="flex items-center justify-center rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"><X className="size-4" aria-hidden="true" /></button>
                )}
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-3 rounded-2xl bg-secondary/40 p-3 sm:flex-row sm:items-center">
            <input type="text" value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Name (optional)" className="rounded-lg border border-border bg-background/40 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring sm:w-40" />
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background/40 px-3">
              <Mail className="size-4 text-muted-foreground" aria-hidden="true" />
              <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") inviteMember() }} placeholder="email@example.com" className="flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground" />
            </div>
            <button type="button" onClick={inviteMember} className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"><UserPlus className="size-4" aria-hidden="true" /> Invite</button>
          </div>
        </section>

        {/* Shared entries */}
        <section aria-label="Shared debts" className="glass flex flex-col gap-4 rounded-3xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-foreground"><HandCoins className="size-4" aria-hidden="true" /></span>
              <h2 className="text-sm font-semibold">Shared debts</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-chart-5/15 px-3 py-1 text-sm font-semibold text-chart-5">To give {formatMoney(toGive)}</span>
              <span className="rounded-full bg-chart-2/15 px-3 py-1 text-sm font-semibold text-chart-2">Given {formatMoney(given)}</span>
              <span className="rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary">Net {formatMoney(net)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl bg-secondary/40 p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input type="text" value={person} onChange={(e) => setPerson(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addEntry() }} placeholder="Person…" className="flex-1 rounded-lg border border-border bg-background/40 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" />
              <select value={category} onChange={(e) => setCategory(e.target.value as DebtCategory)} className="rounded-lg border border-border bg-background/40 px-2.5 py-2 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-ring">
                <option value="to-give">To give</option>
                <option value="given">Given</option>
              </select>
              <input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-28 rounded-lg border border-border bg-background/40 px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addEntry() }} placeholder="Note (optional)…" className="flex-1 rounded-lg border border-border bg-background/40 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" />
              <button type="button" onClick={addEntry} className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"><Plus className="size-4" aria-hidden="true" /> Add entry</button>
            </div>
          </div>

          {active.entries.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No shared debts yet. Add an entry to track who owes what.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {active.entries.map((entry) => {
                const Icon = categoryMeta[entry.category].icon
                return (
                  <li key={entry.id} className="flex items-center gap-3 rounded-2xl bg-secondary/40 p-3">
                    <button type="button" onClick={() => toggleEntry(entry.id)} className={cn("flex size-6 shrink-0 items-center justify-center rounded-md border transition-colors", entry.settled ? "border-primary bg-primary text-primary-foreground" : "border-border text-transparent hover:border-primary hover:text-primary")}><Check className="size-4" aria-hidden="true" /></button>
                    <div className="flex flex-1 flex-col gap-1">
                      <span className={cn("text-sm font-medium", entry.settled && "text-muted-foreground line-through")}>{entry.person}</span>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {entry.note && <span>{entry.note}</span>}
                        <span>added by {entry.addedBy}</span>
                      </div>
                    </div>
                    <span className={cn("flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", categoryMeta[entry.category].chip)}>
                      <Icon className="size-3.5" aria-hidden="true" /> {categoryMeta[entry.category].label}
                    </span>
                    <span className="text-sm font-semibold">{formatMoney(entry.amount)}</span>
                    <button type="button" onClick={() => deleteEntry(entry.id)} className="flex items-center justify-center rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"><Trash2 className="size-4" aria-hidden="true" /></button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    )
  }

  // ---------- Group list view ----------
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <button type="button" onClick={onBack} className="flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="size-4" aria-hidden="true" /> Back to debts</button>
        <div>
          <p className="text-sm text-muted-foreground">Track shared debts with others</p>
          <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">Groups</h1>
        </div>
      </header>

      <section aria-label="Create group" className="glass flex flex-col gap-4 rounded-3xl p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-foreground"><Plus className="size-4" aria-hidden="true" /></span>
          <h2 className="text-sm font-semibold">Create a group</h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") createGroup() }} placeholder="Group name, e.g. Trip, Roommates…" className="flex-1 rounded-lg border border-border bg-background/40 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" />
          <button type="button" onClick={createGroup} className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"><Plus className="size-4" aria-hidden="true" /> Create group</button>
        </div>
      </section>

      <section aria-label="Your groups" className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {groups.length === 0 ? (
          <div className="glass col-span-full rounded-3xl p-8 text-center text-sm text-muted-foreground">You&apos;re not in any groups yet. Create one above to start tracking shared debts.</div>
        ) : (
          groups.map((g) => {
            const pending = g.entries.filter((e) => !e.settled).length
            return (
              <div key={g.id} className="glass flex flex-col gap-4 rounded-3xl p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-foreground"><Users className="size-5" aria-hidden="true" /></span>
                    <div>
                      <h3 className="text-base font-semibold">{g.name}</h3>
                      <p className="text-xs text-muted-foreground">{g.members.length} member{g.members.length === 1 ? "" : "s"} · {pending} pending</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => deleteGroup(g.id)} className="flex items-center justify-center rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"><Trash2 className="size-4" aria-hidden="true" /></button>
                </div>
                <div className="flex -space-x-2">
                  {g.members.map((m) => (
                    <span key={m.id} title={m.name} className={cn("flex size-8 items-center justify-center rounded-full border-2 border-card text-xs font-semibold text-primary-foreground", avatarColor(m.name))}>{m.name.slice(0, 1).toUpperCase()}</span>
                  ))}
                </div>
                <button type="button" onClick={() => setActiveId(g.id)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary">Open group</button>
              </div>
            )
          })
        )}
      </section>
    </div>
  )
}