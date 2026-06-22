"use server";

import prisma from "@/src/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { decrypt } from "@/src/lib/session";

// Helper to get the logged-in user
async function getUserId() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  const parsed = await decrypt(session);
  return parsed?.userId as string;
}

export async function restoreTask(taskId: string) {
  await prisma.task.update({
    where: { id: taskId },
    data: { 
      isCompleted: false, 
      completedAt: null 
    },
  });
  
  revalidatePath("/");
}

export async function deleteArchivedTask(taskId: string) {
  await prisma.task.delete({ 
    where: { id: taskId } 
  });
  
  revalidatePath("/");
}

export async function clearAllArchivedTasks() {
  const userId = await getUserId();
  if (!userId) throw new Error("Unauthorized");

  await prisma.task.deleteMany({
    where: { 
      userId,
      isCompleted: true 
    }
  });

  revalidatePath("/");
}