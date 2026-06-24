"use server";

import prisma from "@/src/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/src/lib/session";
import { revalidatePath } from "next/cache";
import { DebtType } from "@prisma/client";

async function getUserId() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  const parsed = await decrypt(session);
  return parsed?.userId as string;
}

const mapCategoryToDb = (c: "to-give" | "given"): DebtType => {
  return c === "to-give" ? "I_OWE_OTHERS" : "OWED_TO_ME";
};

export async function createDebts(drafts: any[]) {
  const userId = await getUserId();
  if (!userId) throw new Error("Unauthorized");

  const itemsToCreate = drafts.map((d) => ({
    userId,
    personName: d.person,
    description: d.note || null,
    type: mapCategoryToDb(d.category),
    amount: d.amount,
    date: new Date(d.date),
  }));

  await prisma.debt.createMany({ data: itemsToCreate });
  revalidatePath("/");
}

export async function toggleDebtSettled(id: string, isSettled: boolean) {
  await prisma.debt.update({
    where: { id },
    data: { 
      isSettled,
      settledAt: isSettled ? new Date() : null 
    },
  });
  revalidatePath("/");
}

export async function updateDebt(id: string, data: any) {
  await prisma.debt.update({
    where: { id },
    data: {
      personName: data.person,
      description: data.note || null,
      type: mapCategoryToDb(data.category),
      amount: data.amount,
      date: new Date(data.date),
    },
  });
  revalidatePath("/");
}

export async function deleteDebt(id: string) {
  await prisma.debt.delete({ where: { id } });
  revalidatePath("/");
}

// Add this to the bottom of src/actions/debts.ts
export async function addSharedDebt(
  groupId: string, 
  personName: string, 
  note: string, 
  category: "to-give" | "given", 
  amount: number, 
  date: string
) {
  const userId = await getUserId();
  if (!userId) throw new Error("Unauthorized");

  await prisma.debt.create({
    data: {
      userId,
      groupId,
      personName,
      description: note || null,
      type: category === "to-give" ? "I_OWE_OTHERS" : "OWED_TO_ME",
      amount,
      date: new Date(date),
    }
  });
  revalidatePath("/");
}