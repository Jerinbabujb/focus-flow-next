"use server";

import prisma from "@/src/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/src/lib/session";
import { revalidatePath } from "next/cache";
import { Priority as DbPriority, GroceryCategory } from "@prisma/client";

async function getUserId() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  const parsed = await decrypt(session);
  return parsed?.userId as string;
}

const mapPriorityToDb = (p: string): DbPriority => {
  if (p === "p1") return "HIGH";
  if (p === "p3") return "LOW";
  return "MEDIUM";
};

const mapCategoryToDb = (c: string): GroceryCategory => {
  const upper = c.toUpperCase() as GroceryCategory;
  return Object.values(GroceryCategory).includes(upper) ? upper : "OTHER";
};

export async function createGroceryItems(drafts: any[]) {
  const userId = await getUserId();
  if (!userId) throw new Error("Unauthorized");

  const itemsToCreate = drafts.map((d) => ({
    userId,
    name: d.name,
    priority: mapPriorityToDb(d.priority),
    category: mapCategoryToDb(d.category),
    quantity: d.quantity,
    amount: d.amount,
    buyDate: new Date(d.buyDate),
  }));

  await prisma.groceryItem.createMany({ data: itemsToCreate });
  revalidatePath("/");
}

export async function toggleGroceryBought(id: string, isBought: boolean) {
  await prisma.groceryItem.update({
    where: { id },
    data: { 
      isBought,
      boughtAt: isBought ? new Date() : null 
    },
  });
  revalidatePath("/");
}

export async function updateGroceryItem(id: string, data: any) {
  await prisma.groceryItem.update({
    where: { id },
    data: {
      name: data.name,
      priority: mapPriorityToDb(data.priority),
      category: mapCategoryToDb(data.category),
      quantity: data.quantity,
      amount: data.amount,
      buyDate: new Date(data.buyDate),
    },
  });
  revalidatePath("/");
}

export async function deleteGroceryItem(id: string) {
  await prisma.groceryItem.delete({ where: { id } });
  revalidatePath("/");
}