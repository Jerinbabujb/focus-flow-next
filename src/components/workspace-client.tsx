"use client"

import { useState } from "react"
import { Sidebar } from "@/src/components/sidebard"
import { DashboardView } from "@/src/components/dashboard-view"
import { TasksView, type Task } from "@/src/components/task-view"
import { type TaskHistoryItem } from "@/src/components/task-history" // Make sure this path matches your project
import { GroceryView } from "@/src/components/grocery-view"
import { DebtView } from "@/src/components/debt-view"
import { BillArchiveView } from "@/src/components/bill-archive-view"

interface WorkspaceClientProps {
  initialTasks: Task[];
  initialHistory: TaskHistoryItem[]; // <-- Add this to the interface
}

export default function WorkspaceClient({ initialTasks, initialHistory }: WorkspaceClientProps) {
  const [active, setActive] = useState("Overview")

  return (
    <main className="app-backdrop min-h-screen">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 md:flex-row">
        <Sidebar active={active} onNavigate={setActive} />
        <div className="flex-1 py-2 md:py-0">
          {active === "Tasks" ? (
            // Pass the history prop into TasksView
            <TasksView initialTasks={initialTasks} initialHistory={initialHistory} />
          ) : active === "Groceries" ? (
            <GroceryView />
          ) : active === "Debts" ? (
            <DebtView />
          ) : active === "Bill Archive" ? (
            <BillArchiveView />
          ) : (
            <DashboardView onNavigate={setActive} tasks={initialTasks} />
          )}
        </div>
      </div>
    </main>
  )
}