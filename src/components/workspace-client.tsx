"use client"

import { useState } from "react"
import { Sidebar } from "@/src/components/sidebard"
import { DashboardView } from "@/src/components/dashboard-view"
import { TasksView, type Task } from "@/src/components/task-view"
import { type TaskHistoryItem } from "@/src/components/task-history" 
import { GroceryView, type GroceryItem } from "@/src/components/grocery-view" 
import { type HistoryItem as GroceryHistoryItem } from "@/src/components/grocery-history" 
import { type ShoppingGroup } from "@/src/components/grocery-groups" 
import { BillArchiveView } from "@/src/components/bill-archive-view"
import { DebtView, type DebtItem } from "@/src/components/debt-view"
import { type DebtHistoryItem } from "@/src/components/debt-history"
// Import the new Expense view!
import { ExpenseView, type Expense } from "@/src/components/expense-view"
import { SettingsView } from "./settings-view"

interface WorkspaceClientProps {
  userName?: string;
  userEmail?: string;
  initialTasks: Task[];
  initialHistory: TaskHistoryItem[];
  initialGroceries: GroceryItem[]; 
  initialGroceryHistory: GroceryHistoryItem[]; 
  initialGroceryGroups: ShoppingGroup[]; 
  initialDebtGroups: ShoppingGroup[]; 
  initialDebts?: DebtItem[];
  initialDebtHistory?: DebtHistoryItem[];
  
  // Add the new expense props
  initialIncome?: number;
  initialExpenses?: Expense[];
  initialBills?: any[];
}

export default function WorkspaceClient({ 
  userName,
  userEmail,
  initialTasks, 
  initialHistory,
  initialGroceries,
  initialGroceryHistory,
  initialGroceryGroups, 
  initialDebtGroups,
  initialDebts = [],
  initialDebtHistory = [],
  initialIncome = 0,
  initialExpenses = [],
  initialBills=[]
}: WorkspaceClientProps) {
  const [active, setActive] = useState("Overview")

  return (
    <main className="app-backdrop min-h-screen">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 md:flex-row">
        <Sidebar active={active} onNavigate={setActive} userName={userName} />
        <div className="flex-1 py-2 md:py-0">
          
          {active === "Tasks" ? (
            <TasksView initialTasks={initialTasks} initialHistory={initialHistory} />
            
          ) : active === "Groceries" ? (
            <GroceryView 
              initialItems={initialGroceries} 
              initialHistory={initialGroceryHistory} 
              initialGroups={initialGroceryGroups} 
            />
            
          ) : active === "Debts" ? (
            <DebtView  
              initialItems={initialDebts} 
              initialHistory={initialDebtHistory}
              initialGroups={initialDebtGroups as any} 
            />
            
          ) : active === "Bill Archive" ? (
            <BillArchiveView />
            
          ) : active === "Expenses" ? (
            // Render the new Expense View!
            <ExpenseView 
              initialIncome={initialIncome}
              initialExpenses={initialExpenses}
              initialBills={initialBills}
              pendingGroceries={initialGroceries}
              completedGroceries={initialGroceryHistory}
              pendingDebts={initialDebts}
              completedDebts={initialDebtHistory}
              groceryGroups={initialGroceryGroups} 
              debtGroups={initialDebtGroups}
            />

          ): active === "Settings" ? (
            // 2. Add the Settings route here
            <SettingsView initialName={userName} email={userEmail} />

          ) : (
            <DashboardView 
              userName={userName}
              onNavigate={setActive} 
              tasks={initialTasks} 
              
              income={initialIncome}
              expenses={initialExpenses}
              bills={initialBills}
              
              // Pass BOTH pending and completed data now!
              debts={initialDebts}
              debtHistory={initialDebtHistory}
              groceries={initialGroceries}
              groceryHistory={initialGroceryHistory}
            />
          )}
          
        </div>
      </div>
    </main>
  )
}