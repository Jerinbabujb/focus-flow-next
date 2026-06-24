"use client"

import { useState } from "react"
import { Sidebar } from "@/src/components/sidebard"
import { DashboardView } from "@/src/components/dashboard-view"
import { TasksView, type Task } from "@/src/components/task-view"
import { type TaskHistoryItem } from "@/src/components/task-history" 
import { GroceryView, type GroceryItem } from "@/src/components/grocery-view" 
import { type HistoryItem as GroceryHistoryItem } from "@/src/components/grocery-history" 
import { type ShoppingGroup } from "@/src/components/grocery-groups" // <-- Import the type
import { BillArchiveView } from "@/src/components/bill-archive-view"
import { DebtView, type DebtItem } from "@/src/components/debt-view"
import { type DebtHistoryItem } from "@/src/components/debt-history"

interface WorkspaceClientProps {
  initialTasks: Task[];
  initialHistory: TaskHistoryItem[];
  initialGroceries: GroceryItem[]; 
  initialGroceryHistory: GroceryHistoryItem[]; 
  initialGroups: ShoppingGroup[]; // <-- Add to interface
  initialDebts?: DebtItem[]
  initialGroceryGroups: ShoppingGroup[]; 
  initialDebtGroups: ShoppingGroup[];
  initialDebtHistory?: DebtHistoryItem[]
}

export default function WorkspaceClient({ 
  initialTasks, 
  initialHistory,
  initialGroceries,
  initialGroceryHistory,
  initialGroups, // <-- Catch the prop
  initialDebts = [],
  initialDebtHistory = [],
  initialGroceryGroups,
  initialDebtGroups,
}: WorkspaceClientProps) {
  const [active, setActive] = useState("Overview")

  return (
    <main className="app-backdrop min-h-screen">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 md:flex-row">
        <Sidebar active={active} onNavigate={setActive} />
        <div className="flex-1 py-2 md:py-0">
          {active === "Tasks" ? (
            <TasksView initialTasks={initialTasks} initialHistory={initialHistory} />
          ) : active === "Groceries" ? (
            // Pass all three props down to the Grocery view
            <GroceryView 
              initialItems={initialGroceries} 
              initialHistory={initialGroceryHistory} 
              initialGroups={initialGroceryGroups}// <-- Pass to view
            />
          ) : active === "Debts" ? (
            <DebtView  initialItems={initialDebts} 
              initialHistory={initialDebtHistory}
             initialGroups={initialDebtGroups as any}
              />
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