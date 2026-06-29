import prisma from "@/src/lib/prisma"
import { cookies } from "next/headers"
import { decrypt } from "@/src/lib/session"
import { redirect } from "next/navigation"
import WorkspaceClient from "@/src/components/workspace-client"
import { SettingsProvider } from "@/src/components/settings-provider"

export default async function Page() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  const parsed = await decrypt(session);

  if (!parsed?.userId) {
    redirect("/auth");
  }

  const userId = parsed.userId as string;

  // --- 1. FETCH TASKS ---
  const pendingDbTasks = await prisma.task.findMany({ where: { userId, isCompleted: false }, orderBy: { createdAt: "desc" }});
  const historyDbTasks = await prisma.task.findMany({ where: { userId, isCompleted: true }, orderBy: { completedAt: "desc" }, take: 50 });

  // --- 2. FETCH GROCERIES ---
  const pendingDbGroceries = await prisma.groceryItem.findMany({ where: { userId, isBought: false, groupId: null }, orderBy: { createdAt: "desc" }});
  const historyDbGroceries = await prisma.groceryItem.findMany({
    where: { isBought: true, OR: [{ userId: userId }, { group: { members: { some: { userId: userId } } } }] },
    include: { group: true },
    orderBy: { boughtAt: "desc" }, take: 100, 
  });

  // --- 3. FETCH GROUPS ---
  const dbGroups = await prisma.group.findMany({
    where: { members: { some: { userId } } },
    include: { members: true, groceryItems: { orderBy: { createdAt: "desc" } }, debts: { orderBy: { createdAt: "desc" } } }
  });

  // --- 4. FETCH DEBTS ---
  const pendingDbDebts = await prisma.debt.findMany({ where: { userId, isSettled: false, groupId: null }, orderBy: { date: "desc" }});
  const historyDbDebts = await prisma.debt.findMany({ where: { userId, isSettled: true }, orderBy: { settledAt: "desc" }, take: 100 });

  // --- 5. FORMAT TASKS ---
  const formattedTasks = pendingDbTasks.map((t) => ({ id: t.id, title: t.title, priority: t.priority === "HIGH" ? "p1" : t.priority === "LOW" ? "p3" : "p2", repeat: (t.repeatInterval as any) || "none", completed: t.isCompleted }));
  const formattedHistory = historyDbTasks.map((t) => ({ id: t.id, title: t.title, priority: t.priority === "HIGH" ? "p1" : t.priority === "LOW" ? "p3" : "p2", repeat: (t.repeatInterval as any) || "none", completedAt: t.completedAt ? t.completedAt.toISOString() : new Date().toISOString() }));

  // --- 6. FORMAT GROCERIES ---
  const formatCategory = (c: string) => {
    const valid = ["Produce", "Dairy", "Bakery", "Meat", "Pantry", "Frozen", "Household", "Other"];
    const formatted = c.charAt(0) + c.slice(1).toLowerCase();
    return valid.includes(formatted) ? formatted : "Other";
  };
  const formattedGroceries = pendingDbGroceries.map((g) => ({ id: g.id, name: g.name, priority: g.priority === "HIGH" ? "p1" : g.priority === "LOW" ? "p3" : "p2", category: formatCategory(g.category) as any, quantity: g.quantity, amount: g.amount, buyDate: g.buyDate.toISOString().slice(0, 10) }));
  const formattedGroceryHistory = historyDbGroceries.map((g) => ({ id: g.id, name: g.name, priority: g.priority === "HIGH" ? "p1" : g.priority === "LOW" ? "p3" : "p2", category: formatCategory(g.category) as any, quantity: g.quantity, amount: g.amount, buyDate: g.buyDate.toISOString().slice(0, 10), boughtAt: g.boughtAt ? g.boughtAt.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10), groupName: g.group?.name || null }));

  // --- 7. FORMAT GROUPS ---
  const allFormattedGroups = dbGroups.map((g) => ({
    id: g.id, name: g.name, type: g.type, 
    members: g.members.map((m) => ({ id: m.id, name: m.name || m.email.split("@")[0], email: m.email, status: m.status as any })),
    items: g.groceryItems.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity, amount: i.amount, addedBy: i.addedByName || "Unknown", bought: i.isBought })),
    entries: g.debts.map((d) => ({ id: d.id, person: d.personName, note: d.description || "", category: (d.type === "I_OWE_OTHERS" ? "to-give" : "given") as any, amount: d.amount, addedBy: "You", settled: d.isSettled }))
  }));
  const groceryGroups = allFormattedGroups.filter(g => g.type === "GROCERY" || !g.type);
  const debtGroups = allFormattedGroups.filter(g => g.type === "DEBT");

  // --- 8. FORMAT DEBTS ---
  const formattedDebts = pendingDbDebts.map((d) => ({ id: d.id, person: d.personName, note: d.description || "", category: (d.type === "I_OWE_OTHERS" ? "to-give" : "given") as any, amount: d.amount, date: d.date.toISOString().slice(0, 10) }));
  const formattedDebtHistory = historyDbDebts.map((d) => ({ id: d.id, person: d.personName, note: d.description || "", category: (d.type === "I_OWE_OTHERS" ? "to-give" : "given") as any, amount: d.amount, date: d.date.toISOString().slice(0, 10), settledAt: d.settledAt ? d.settledAt.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10) }));

  // --- 9. FETCH EXPENSES & BILLS ---
  const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { monthlyIncome: true, name: true , email: true}});
  const dbExpenses = await prisma.expense.findMany({ where: { userId }, orderBy: { date: "desc" }});
  const formattedExpenses = dbExpenses.map(e => ({ id: e.id, name: e.description, amount: e.amount, category: e.category, source: (e.source as any) || "manual", date: e.date.toISOString().slice(0, 10) }));
  
  const dbBills = await prisma.billArchive.findMany({ where: { userId }, orderBy: { createdAt: "desc" }});
  const formattedBills = dbBills.map(b => ({ id: b.id, vendorName: b.vendorName || "Unknown", amount: b.amount, date: (b.receiptDate || b.createdAt).toISOString().slice(0, 10), pathname: b.s3Url }));

  // --- 10. RENDER CLIENT ---
  return (
    <SettingsProvider>
    <WorkspaceClient 
      userName={dbUser?.name || "User"}
      userEmail={dbUser?.email || "No email found"}
      initialTasks={formattedTasks} initialHistory={formattedHistory} 
      initialGroceries={formattedGroceries} initialGroceryHistory={formattedGroceryHistory}
      initialGroceryGroups={groceryGroups as any} initialDebtGroups={debtGroups as any}       
      initialDebts={formattedDebts} initialDebtHistory={formattedDebtHistory}
      initialIncome={dbUser?.monthlyIncome || 0} initialExpenses={formattedExpenses} initialBills={formattedBills}
    />
    </SettingsProvider>
  );
}