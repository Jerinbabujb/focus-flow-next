"use client"

import { useMemo, useState } from "react"
import {
  Users,
  ArrowLeft,
  Plus,
  UserPlus,
  X,
  Trash2,
  ShoppingBasket,
  Check,
  Mail,
  ShoppingCart,
} from "lucide-react"
import { cn } from "@/src/lib/utils"

interface Member {
  id: string
  name: string
  email: string
  status: "owner" | "joined" | "invited"
}

interface GroupItem {
  id: string
  name: string
  quantity: number
  amount: number | null
  addedBy: string
  bought: boolean
}

interface ShoppingGroup {
  id: string
  name: string
  members: Member[]
  items: GroupItem[]
}

const formatMoney = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD" })

let idc = 0
const nid = (p: string) => `${p}-${Date.now()}-${idc++}`

const initialGroups: ShoppingGroup[] = [
  {
    id: "grp-1",
    name: "Apartment 4B",
    members: [
      { id: "m1", name: "You", email: "you@example.com", status: "owner" },
      { id: "m2", name: "Jordan", email: "jordan@example.com", status: "joined" },
      { id: "m3", name: "Sam", email: "sam@example.com", status: "invited" },
    ],
    items: [
      { id: "gi1", name: "Dish soap", quantity: 1, amount: 3.5, addedBy: "Jordan", bought: false },
      { id: "gi2", name: "Paper towels", quantity: 2, amount: 6.0, addedBy: "You", bought: true },
    ],
  },
]

const avatarColor = (name: string) => {
  const colors = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"]
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return colors[Math.abs(h) % colors.length]
}

interface GroceryGroupsProps {
  onBack: () => void
}

export function GroceryGroups({ onBack }: GroceryGroupsProps) {
  const [groups, setGroups] = useState<ShoppingGroup[]>(initialGroups)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [newGroupName, setNewGroupName] = useState("")

  // invite form
  const [inviteName, setInviteName] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")

  // item form
  const [itemName, setItemName] = useState("")
  const [itemQty, setItemQty] = useState("1")
  const [itemAmount, setItemAmount] = useState("")

  const active = useMemo(() => groups.find((g) => g.id === activeId) ?? null, [groups, activeId])

  const createGroup = () => {
    if (newGroupName.trim() === "") return
    const g: ShoppingGroup = {
      id: nid("grp"),
      name: newGroupName.trim(),
      members: [{ id: nid("m"), name: "You", email: "you@example.com", status: "owner" }],
      items: [],
    }
    setGroups((prev) => [g, ...prev])
    setNewGroupName("")
    setActiveId(g.id)
  }

  const deleteGroup = (id: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== id))
    if (activeId === id) setActiveId(null)
  }

  const inviteMember = () => {
    if (!active || inviteEmail.trim() === "") return
    const member: Member = {
      id: nid("m"),
      name: inviteName.trim() || inviteEmail.trim().split("@")[0],
      email: inviteEmail.trim(),
      status: "invited",
    }
    setGroups((prev) =>
      prev.map((g) => (g.id === active.id ? { ...g, members: [...g.members, member] } : g)),
    )
    setInviteName("")
    setInviteEmail("")
  }

  const removeMember = (memberId: string) => {
    if (!active) return
    setGroups((prev) =>
      prev.map((g) =>
        g.id === active.id ? { ...g, members: g.members.filter((m) => m.id !== memberId) } : g,
      ),
    )
  }

  const addItem = () => {
    if (!active || itemName.trim() === "") return
    const item: GroupItem = {
      id: nid("gi"),
      name: itemName.trim(),
      quantity: Math.max(1, Number.parseInt(itemQty, 10) || 1),
      amount: itemAmount.trim() === "" ? null : Math.max(0, Number.parseFloat(itemAmount) || 0),
      addedBy: "You",
      bought: false,
    }
    setGroups((prev) =>
      prev.map((g) => (g.id === active.id ? { ...g, items: [item, ...g.items] } : g)),
    )
    setItemName("")
    setItemQty("1")
    setItemAmount("")
  }

  const toggleItem = (itemId: string) => {
    if (!active) return
    setGroups((prev) =>
      prev.map((g) =>
        g.id === active.id
          ? {
              ...g,
              items: g.items.map((i) => (i.id === itemId ? { ...i, bought: !i.bought } : i)),
            }
          : g,
      ),
    )
  }

  const deleteItem = (itemId: string) => {
    if (!active) return
    setGroups((prev) =>
      prev.map((g) =>
        g.id === active.id ? { ...g, items: g.items.filter((i) => i.id !== itemId) } : g,
      ),
    )
  }

  // ---------- Group detail view ----------
  if (active) {
    const groupTotal = active.items.reduce((s, i) => s + (i.amount ?? 0), 0)
    return (
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setActiveId(null)}
            className="flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            All groups
          </button>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Shared shopping group</p>
              <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
                {active.name}
              </h1>
            </div>
            <div className="flex -space-x-2">
              {active.members.map((m) => (
                <span
                  key={m.id}
                  title={m.name}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full border-2 border-card text-xs font-semibold text-primary-foreground",
                    avatarColor(m.name),
                  )}
                >
                  {m.name.slice(0, 1).toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        </header>

        {/* Members */}
        <section aria-label="Members" className="glass flex flex-col gap-4 rounded-3xl p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-foreground">
              <Users className="size-4" aria-hidden="true" />
            </span>
            <h2 className="text-sm font-semibold">Members</h2>
            <span className="text-xs text-muted-foreground">({active.members.length})</span>
          </div>

          <ul className="flex flex-col gap-2">
            {active.members.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-3 rounded-2xl bg-secondary/40 p-3"
              >
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full text-xs font-semibold text-primary-foreground",
                    avatarColor(m.name),
                  )}
                >
                  {m.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-medium">{m.name}</span>
                  <span className="text-xs text-muted-foreground">{m.email}</span>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
                    m.status === "owner" && "bg-primary/15 text-primary",
                    m.status === "joined" && "bg-chart-2/15 text-chart-2",
                    m.status === "invited" && "bg-chart-4/15 text-chart-4",
                  )}
                >
                  {m.status}
                </span>
                {m.status !== "owner" && (
                  <button
                    type="button"
                    onClick={() => removeMember(m.id)}
                    className="flex items-center justify-center rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                    aria-label={`Remove ${m.name}`}
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ul>

          {/* Invite form */}
          <div className="flex flex-col gap-3 rounded-2xl bg-secondary/40 p-3 sm:flex-row sm:items-center">
            <input
              type="text"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Name (optional)"
              className="rounded-lg border border-border bg-background/40 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring sm:w-40"
              aria-label="Invitee name"
            />
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background/40 px-3">
              <Mail className="size-4 text-muted-foreground" aria-hidden="true" />
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") inviteMember()
                }}
                placeholder="email@example.com"
                className="flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                aria-label="Invitee email"
              />
            </div>
            <button
              type="button"
              onClick={inviteMember}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <UserPlus className="size-4" aria-hidden="true" />
              Invite
            </button>
          </div>
        </section>

        {/* Shared items */}
        <section aria-label="Shared list" className="glass flex flex-col gap-4 rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-foreground">
                <ShoppingCart className="size-4" aria-hidden="true" />
              </span>
              <h2 className="text-sm font-semibold">Shared list</h2>
            </div>
            <span className="rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary">
              {formatMoney(groupTotal)}
            </span>
          </div>

          {/* add item */}
          <div className="flex flex-col gap-3 rounded-2xl bg-secondary/40 p-3 sm:flex-row sm:items-center">
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addItem()
              }}
              placeholder="Add to shared list…"
              className="flex-1 rounded-lg border border-border bg-background/40 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              aria-label="Item name"
            />
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShoppingBasket className="size-3.5" aria-hidden="true" />
              Qty
              <input
                type="number"
                min={1}
                value={itemQty}
                onChange={(e) => setItemQty(e.target.value)}
                className="w-16 rounded-lg border border-border bg-background/40 px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                aria-label="Quantity"
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Amount
              <input
                type="number"
                min={0}
                step="0.01"
                value={itemAmount}
                onChange={(e) => setItemAmount(e.target.value)}
                placeholder="0.00"
                className="w-24 rounded-lg border border-border bg-background/40 px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                aria-label="Amount (optional)"
              />
            </label>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="size-4" aria-hidden="true" />
              Add
            </button>
          </div>

          {active.items.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No shared items yet. Add something for the group to pick up.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {active.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl bg-secondary/40 p-3"
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-md border transition-colors",
                      item.bought
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-transparent hover:border-primary hover:text-primary",
                    )}
                    aria-label={item.bought ? "Mark as not bought" : "Mark as bought"}
                  >
                    <Check className="size-4" aria-hidden="true" />
                  </button>
                  <div className="flex flex-1 flex-col gap-1">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        item.bought && "text-muted-foreground line-through",
                      )}
                    >
                      {item.name}
                    </span>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ShoppingBasket className="size-3" aria-hidden="true" />
                        {item.quantity}
                      </span>
                      {item.amount != null && <span>{formatMoney(item.amount)}</span>}
                      <span>added by {item.addedBy}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteItem(item.id)}
                    className="flex items-center justify-center rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                    aria-label="Delete item"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
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
        <button
          type="button"
          onClick={onBack}
          className="flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to groceries
        </button>
        <div>
          <p className="text-sm text-muted-foreground">Shop together with others</p>
          <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
            Groups
          </h1>
        </div>
      </header>

      {/* Create group */}
      <section aria-label="Create group" className="glass flex flex-col gap-4 rounded-3xl p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-foreground">
            <Plus className="size-4" aria-hidden="true" />
          </span>
          <h2 className="text-sm font-semibold">Create a group</h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") createGroup()
            }}
            placeholder="Group name, e.g. Family, Roommates…"
            className="flex-1 rounded-lg border border-border bg-background/40 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            aria-label="Group name"
          />
          <button
            type="button"
            onClick={createGroup}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" aria-hidden="true" />
            Create group
          </button>
        </div>
      </section>

      {/* Group cards */}
      <section aria-label="Your groups" className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {groups.length === 0 ? (
          <div className="glass col-span-full rounded-3xl p-8 text-center text-sm text-muted-foreground">
            You&apos;re not in any groups yet. Create one above to start shopping together.
          </div>
        ) : (
          groups.map((g) => {
            const pending = g.items.filter((i) => !i.bought).length
            return (
              <div key={g.id} className="glass flex flex-col gap-4 rounded-3xl p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-foreground">
                      <Users className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-base font-semibold">{g.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {g.members.length} member{g.members.length === 1 ? "" : "s"} ·{" "}
                        {pending} pending
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteGroup(g.id)}
                    className="flex items-center justify-center rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                    aria-label={`Delete ${g.name}`}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="flex -space-x-2">
                  {g.members.map((m) => (
                    <span
                      key={m.id}
                      title={m.name}
                      className={cn(
                        "flex size-8 items-center justify-center rounded-full border-2 border-card text-xs font-semibold text-primary-foreground",
                        avatarColor(m.name),
                      )}
                    >
                      {m.name.slice(0, 1).toUpperCase()}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setActiveId(g.id)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  Open group
                </button>
              </div>
            )
          })
        )}
      </section>
    </div>
  )
}
