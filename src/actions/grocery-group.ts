"use server";

import prisma from "@/src/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/src/lib/session";
import { revalidatePath } from "next/cache";

async function getUser() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  const parsed = await decrypt(session);
  if (!parsed?.userId) throw new Error("Unauthorized");
  
  return prisma.user.findUnique({ where: { id: parsed.userId as string } });
}

export async function createGroupAction(name: string,type: "GROCERY" | "DEBT" = "GROCERY") {
  const user = await getUser();
  if (!user) return;

  await prisma.group.create({
    data: {
      name,
      type,
      members: {
        create: {
          userId: user.id,
          email: user.email,
          name: user.name || "You",
          role: "owner",
          status: "joined",
        }
      }
    }
  });
  revalidatePath("/");
}

export async function deleteGroupAction(groupId: string) {
  await prisma.group.delete({ where: { id: groupId } });
  revalidatePath("/");
}

export async function inviteMemberAction(groupId: string, email: string, name: string) {
  await prisma.groupMember.create({
    data: {
      groupId,
      email,
      name: name || email.split("@")[0],
      role: "member",
      status: "invited",
    }
  });
  revalidatePath("/");
}

export async function removeMemberAction(memberId: string) {
  await prisma.groupMember.delete({ where: { id: memberId } });
  revalidatePath("/");
}


export async function addSharedGroceryItem(groupId: string, name: string, quantity: number, amount: number | null) {
  const user = await getUser();
  if (!user) return;

  await prisma.groceryItem.create({
    data: {
      userId: user.id,
      groupId,
      name,
      quantity,
      amount,
      addedByName: user.name || "You",
    }
  });
  revalidatePath("/");
}