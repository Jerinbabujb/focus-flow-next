import prisma from "@/src/lib/prisma"
import { cookies } from "next/headers"
import { decrypt } from "@/src/lib/session"
import { redirect } from "next/navigation"
import WorkspaceClient from "@/src/components/workspace-client"

export default async function Page() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  const parsed = await decrypt(session);

  if (!parsed?.userId) {
    redirect("/auth");
  }

  const userId = parsed.userId as string;

  // 1. Fetch ONLY pending active tasks
  const pendingDbTasks = await prisma.task.findMany({
    where: { userId, isCompleted: false }, // <-- Added filter here
    orderBy: { createdAt: "desc" },
  });

  // 2. Fetch ONLY completed tasks for the History view
  const historyDbTasks = await prisma.task.findMany({
    where: { userId, isCompleted: true }, // <-- Added filter here
    orderBy: { completedAt: "desc" },
    take: 50, // Limit so the history page loads instantly
  });

  // 3. Format active tasks
  const formattedTasks = pendingDbTasks.map((t) => ({
    id: t.id,
    title: t.title,
    priority: t.priority === "HIGH" ? "p1" : t.priority === "LOW" ? "p3" : "p2",
    repeat: (t.repeatInterval as "none" | "daily" | "weekly" | "monthly") || "none",
    completed: t.isCompleted,
  }));

  // 4. Format history tasks
  const formattedHistory = historyDbTasks.map((t) => ({
    id: t.id,
    title: t.title,
    priority: t.priority === "HIGH" ? "p1" : t.priority === "LOW" ? "p3" : "p2",
    repeat: (t.repeatInterval as "none" | "daily" | "weekly" | "monthly") || "none",
    completedAt: t.completedAt ? t.completedAt.toISOString() : new Date().toISOString(),
  }));

  // 5. Pass BOTH to the client wrapper
  return <WorkspaceClient initialTasks={formattedTasks} initialHistory={formattedHistory} />;
}