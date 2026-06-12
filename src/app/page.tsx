"use client"

import { useState } from "react"
import { Sidebar } from "@/src/components/sidebard"
import { DashboardView } from "@/src/components/dashboard-view"
import { TasksView } from "@/src/components/task-view"
import { GroceryView } from "@/src/components/grocery-view"
import { DebtView } from "@/src/components/debt-view"
import { BillArchiveView } from "@/src/components/bill-archive-view"

export default function Page() {
  const [active, setActive] = useState("Overview")

  return (
    <main className="app-backdrop min-h-screen">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 md:flex-row">
        <Sidebar active={active} onNavigate={setActive} />
        <div className="flex-1 py-2 md:py-0">
          {active === "Tasks" ? (
            <TasksView />
          ) : active === "Groceries" ? (
            <GroceryView />
          ) : active === "Debts" ? (
            <DebtView />
          ) : active === "Bill Archive" ? (
            <BillArchiveView />
          ) : (
            <DashboardView />
          )}
        </div>
      </div>
    </main>
  )
}
