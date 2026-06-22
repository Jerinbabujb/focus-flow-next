"use server";

import prisma from "@/src/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/src/lib/session";
import { revalidatePath } from "next/cache";
import { Priority as DbPriority } from "@prisma/client";

// Helper to get the logged-in user
async function getUserId() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  const parsed = await decrypt(session);
  return parsed?.userId as string;
}

// Map frontend P1/P2/P3 to Database HIGH/MEDIUM/LOW
const mapPriorityToDb = (p: string): DbPriority => {
  if (p === "p1") return "HIGH";
  if (p === "p3") return "LOW";
  return "MEDIUM";
};

export async function createTasks(drafts: { title: string; priority: string; repeat: string }[]) {
  const userId = await getUserId();
  if (!userId) throw new Error("Unauthorized");

  const tasksToCreate = drafts.map((d) => ({
    userId,
    title: d.title,
    priority: mapPriorityToDb(d.priority),
    isRecurring: d.repeat !== "none",
    repeatInterval: d.repeat === "none" ? null : d.repeat,
  }));

  await prisma.task.createMany({ data: tasksToCreate });
  revalidatePath("/"); // Tells Next.js to refresh the dashboard data
}

export async function toggleTaskCompletion(taskId: string, isCompleted: boolean) {
  await prisma.task.update({
    where: { id: taskId },
    data: { 
      isCompleted,
      completedAt: isCompleted ? new Date() : null 
    },
  });
  revalidatePath("/");
}

export async function updateTaskDetails(taskId: string, title: string, priority: string, repeat: string) {
  await prisma.task.update({
    where: { id: taskId },
    data: {
      title,
      priority: mapPriorityToDb(priority),
      isRecurring: repeat !== "none",
      repeatInterval: repeat === "none" ? null : repeat,
    },
  });
  revalidatePath("/");
}

export async function deleteTaskAction(taskId: string) {
  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath("/");
}