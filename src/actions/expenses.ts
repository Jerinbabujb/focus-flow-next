"use server";

import prisma from "@/src/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/src/lib/session";
import { revalidatePath } from "next/cache";

async function getUserId() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  const parsed = await decrypt(session);
  return parsed?.userId as string;
}

export async function updateIncomeAction(amount: number) {
  const userId = await getUserId();
  if (!userId) return;

  await prisma.user.update({
    where: { id: userId },
    data: { monthlyIncome: amount }
  });
  revalidatePath("/");
}

export async function addExpenseAction(name: string, amount: number, category: string, source: string) {
  const userId = await getUserId();
  if (!userId) return;

  await prisma.expense.create({
    data: {
      userId,
      description: name,
      amount,
      category,
      source,
    }
  });
  revalidatePath("/");
}

export async function deleteExpenseAction(id: string) {
  await prisma.expense.delete({ where: { id } });
  revalidatePath("/");
}